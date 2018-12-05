"use strict";

import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient";
import { DafnyClientProvider } from "./dafnyProvider";
import { DafnyRunner } from "./dafnyRunner";
import { WarningMsg, LanguageServerNotification, ErrorMsg } from "./stringRessources";
import DafnyLanguageClient from './server/dafnyLanguageClient';
import Notifications from "./ui/notifications";
import Commands from "./ui/commands";
import { Context } from "./context";
import Capabilities from "./helpers/capabilities";

let languageServer: LanguageClient = null;
let provider: DafnyClientProvider;
const runner: DafnyRunner = new DafnyRunner();

export function activate(extensionContext: vscode.ExtensionContext) {

    // @todo This should be a gracefull feature reduction
    if (vscode.workspace.rootPath === undefined) {
        vscode.window.showWarningMessage(WarningMsg.NoWorkspace);
    }

    if(!Capabilities.hasSupportedMonoVersion()) {
        // Promt the user to install Mono and stop extension execution.
        vscode.window.showErrorMessage(ErrorMsg.NoSupportedMono, ErrorMsg.ConfigureMonoPath, ErrorMsg.GetMono)
        .then(selection => {
            if(selection === ErrorMsg.GetMono) {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(ErrorMsg.GetMonoUri));
            }

            if(selection === ErrorMsg.ConfigureMonoPath) {
                vscode.commands.executeCommand('workbench.action.configureLanguageBasedSettings');
            }
        });
        return;
    }

    languageServer = new DafnyLanguageClient(extensionContext);

    languageServer.onReady().then(() => {
        provider = new DafnyClientProvider(extensionContext, languageServer);

        const commands = new Commands(extensionContext, languageServer, provider, runner);
        commands.registerCommands();

        const notifications = new Notifications(extensionContext, languageServer, provider, commands);
        notifications.registerNotifications();

        languageServer.onNotification(LanguageServerNotification.Ready, () => {
            if (Context.unitTest) {
                Context.unitTest.backendStarted();
            }
            provider.activate(extensionContext.subscriptions);
        });
    });

    const languageServerDisposable = languageServer.start();
    extensionContext.subscriptions.push(languageServerDisposable);
}