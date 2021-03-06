# Barasite Eve

This program translates extracted dialogue and text from **Parasite Eve**, provided by [Translation tools](https://www.romhacking.net/utilities/1150/). The translation goes for several times between different languages, which may result in bizarre and amusing results.

![demo](https://i.imgur.com/EE3VxFO.gif)

## Installation guide

* [Download the provided patches and software on release page of this repository.](https://github.com/suXinjke/BarasiteEve/releases)

#### CDmage
* Open your Parasite Eve image file.
* Most likely you will be asked to specify a track format, try **M2/2352**, which worked for me. If it doesn't work, try the others that support your image file format.
* Make sure there's a flie **SLUS_006.62** for CD1, and **SLUS_006.68** for CD2, the patches provided only work with these versions of the game.
* Select Track 1 of your opened image file, right click on **PE.IMG** file in the right section and choose **Extract Files...**, proceed to extract the file to the directory you want.

#### Launch DeltaPatcherLite
* Select **PE.IMG** as Original file, and **one of the provided .xdelta files** as XDelta patch.
* Apply the patch, your **PE.IMG** should be updated.

#### Back to CDmage
* Right click on **PE.IMG**, select **Import File...**, choose **patched PE.IMG** as imported file.
* Select **File** - **Save As...** to save new image file. Leave settings by default. The new image will always be in bin/cue format.
* Launch this newly created bin/cue on emulator or console, and *enjoy* bad translation craziness.

## Making your own bad translation

#### Prerequisites
* [Latest version of node.js](https://nodejs.org/en/download/)
* [Free Yandex API translation key](https://tech.yandex.com/translate/)
* [Parasite Eve translation tools](https://www.romhacking.net/utilities/1150/)

#### Translating
* Follow the README of the Translation tools to extract the data from **Parasite Eve**.
* Register on **Yandex** if required, to get the **API translation key**, which will be used in the next step.
* Copy `config.js.default` file as `config.js`. Fill the required data and change the language settings if needed.
* Install the required libraries, in your command line while in the script directory: `npm install`
* Launch the script from command line: `node main.js`
* Follow the **README** of the **Translation tools** to import the translation data into newly created **PE.IMG**

#### Notes
* Don't make **long translation chains** if you use **free Yandex API**, as it has daily and monthly limits.
* Resulting **translation may fail to import if it's total file size goes over the certain limit**, in that case there will be a warning in **Translation tools** scripts.
