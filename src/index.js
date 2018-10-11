'use strict';
import inquirer from 'inquirer'
import figlet from 'figlet'
import chalk from 'chalk'
import proxy from './proxy'
import moment from 'moment'

import filesize from "filesize";
import args from "./args";

(async () => {
    welcome();
    let args = require('./args');
    registerHandlers();

    try {
        let logger = require('./logging');
        let threshold = args.getThresholdDate() || {
            duration: args.getThresholdDuration(),
            unit:     args.getThresholdUnit()
        };
        let response = await proxy.getArtifacts(threshold);
        let shouldDelete = true;
        let deleteConfirmationAnswer;
        let isDryRun = args.isDryRun();
        if (!args.isQuiet() && !isDryRun) {
            try {
                deleteConfirmationAnswer = await inquirer.prompt({
                    'type':    'confirm',
                    'name':    'deleteConfirmation',
                    'message': chalk.whiteBright.bgRed('Are you sure you want to delete the above artifacts?')
                });
            } catch (error) {
                deleteConfirmationAnswer = { deleteConfirmation: false }
            }
            shouldDelete = deleteConfirmationAnswer.deleteConfirmation;
        }
        if (shouldDelete && response.items.size) {
            await proxy.deleteArtifacts(response.items, isDryRun);
        }
        let dryrunPrefix = isDryRun ? chalk.yellowBright.bgBlue('***') : '';

        logger.info("%sTotal of %s were deleted for a threshold of: %s and filter of %s", dryrunPrefix, filesize(response.totalSize), moment(response.thresholdTime).format('LLL'), args.getPrefixFilter());

    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }

    function welcome() {
        console.log(chalk.yellow(figlet.textSync('Artifactory Cleanup', { horizontalLayout: 'full' })));
    }

    function registerHandlers() {
        process.on('uncaughtException', (err) => {
            console.error(`Error: ${err.message}`)
        })
    }
})();
