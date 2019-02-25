const fs = require( 'fs' )
const path = require( 'path' )
const cp1252 = require( 'windows-1252' )
const axios = require( 'axios' )
const https = require( 'https' )

const httpsAgent = new https.Agent( { keepAlive: true } )

const config = require( './config.js' )

function randomInt( max ) {
    return Math.floor( Math.random() * Math.floor( max + 1 ) )
}

async function transformFile( filePath, transformer ) {
    let output = ''
    let piece = ''
    let service = false

    const inputFile = cp1252.decode( fs.readFileSync( filePath ).toString( 'binary' ) )

    for ( const chr of inputFile ) {
        if ( chr === '[' ) {
            if ( piece ) {
                const pieces = piece.split( '\r\n' )
                for ( let i = 0 ; i < pieces.length ; i++ ) {
                    if ( pieces[i] == '******xEnDx******' ) {
                        continue
                    }

                    // regexp to extract the whitespace before text, and the actual text to transform
                    // ???: not sure why ':' is extracted along with whitespace
                    const subPieces = pieces[i].match( /^([\s:]*)(.*)/ )
                    pieces[i] = subPieces[1] + await transformer( subPieces[2] )
                }

                const transformedPiece = pieces.join( '\r\n' ).replace( /"/g, '“' )

                // console.log( { piece, transformedPiece } )
                output += transformedPiece
                piece = ''
            }

            output += chr
            service = true
        } else if ( chr === ']' ) {
            output += chr
            service = false
        } else if ( chr.match( /\s/ ) ) {
            if ( piece ) {
                piece += chr
            } else {
                output += chr
            }
        } else {
            if ( !service ) {
                piece += chr
            } else {
                output += chr
            }

        }
    }

    if ( piece ) {
        output += piece
    }

    return output
}

async function translateYadex( input, from, to ) {

    let result = undefined
    while ( result === undefined ) {
        try {
            result = ( await axios.get( `https://translate.yandex.net/api/v1.5/tr.json/translate`, {
                params: {
                    key: config.yandex_key,
                    lang: `${from}-${to}`,
                    text: input
                },

                httpsAgent
            } ) ).data.text[0]
        } catch ( err ) {
            console.log( err.message )
        }
    }

    return result
}

async function translateSequential( translationFunction, input, languages ) {
    if ( !input ) {
        return ''
    }

    if ( typeof input === 'string' && !input.match( /[a-zA-Z]/ ) ) {
        return ''
    }

    let result = input

    for ( let i = 0 ; i < languages.length - 1 ; i++ ) {
        const from = languages[i]
        const to = languages[i+1]

        result = await translationFunction( result, from, to )
    }

    return result
}

function getLanguagePreset() {
    const { language_presets, languages, translation_chain_length } = config
    if ( !language_presets || language_presets.length > 0 ) {
        return language_presets[ randomInt( language_presets.length - 1 ) ]
    } else {
        const randomLanguages = ( new Array( translation_chain_length ) ).fill( undefined ).map( () => {
            return languages[ randomInt( languages.length - 1 ) ]
        } )

        return [ 'en', ...randomLanguages, 'en' ]
    }
}

async function main() {

    const main_dir = config.parasite_eve_tools_directory
    if ( !main_dir ) {
        throw new Error( 'No Parasite Eve translation tools directory specified' )
    }

    const file_dirs = [
        path.join( main_dir, 'extracted', 'dlgmain' ),
        path.join( main_dir, 'extracted', 'dothers' )
    ]

    for ( const file_dir of file_dirs ) {
        const files_names = fs.readdirSync( file_dir )
        for ( const file_name of files_names ) {
            const file_path = path.join( file_dir, file_name )
            if ( file_name.startsWith( 'slus' ) ) {
                continue
            }

            const outputDirPath = path.join( main_dir, 'import', path.basename( file_dir ) )
            const outputFilePath = path.join( outputDirPath, file_name )
            if ( fs.existsSync( outputFilePath ) ) {
                continue
            }

            console.log( `Transforming file ${file_name}` )
            const transformedFile = await transformFile( file_path, async str => {
                let result = undefined

                while ( result === undefined ) {
                    try {
                        const languages = getLanguagePreset()
                        const translated = await translateSequential( translateYadex, str, languages )

                        console.log( { piece: str, transformedPiece: translated, languages } )

                        if ( translated.match( /[^ -~“]/ ) ) {
                            throw new Error( 'Apparently got non english result' )
                        }
                        cp1252.encode( translated )

                        const originalStringTrimmed = str.trim()
                        const originalLineStartedWithUpperCase = originalStringTrimmed && originalStringTrimmed[0].toLowerCase() !== originalStringTrimmed[0]
                        if ( !originalStringTrimmed || originalLineStartedWithUpperCase ) {
                            result = translated
                        } else {
                            result = translated.replace( /\w/, match => match.toLowerCase() )
                        }
                    } catch ( err ) {
                        console.log( err.message )
                        result = undefined
                    }
                }

                return result
            } )

            if ( !fs.existsSync( outputDirPath ) ) {
                fs.mkdirSync( outputDirPath )
            }

            fs.writeFileSync( outputFilePath, cp1252.encode( transformedFile ), { encoding: 'binary' } )
        }
    }
}

main()
