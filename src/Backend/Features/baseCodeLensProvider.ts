"use strict";
import {CodeLens, CodeLensProvider, Event, EventEmitter, TextDocument} from "vscode";
import {DafnyServer} from "../dafnyServer";
import { bubbleRejectedPromise } from "./../../Util/PromiseHelpers";
import { ReferencesCodeLens } from "./CodeLenses";
import { Symbol, SymbolTable } from "./symbols";

export class DafnyBaseCodeLensProvider implements CodeLensProvider {
    private enabled: boolean = true;
    private onDidChangeCodeLensesEmitter = new EventEmitter<void>();

    public constructor(public server: DafnyServer) {}

    public get onDidChangeCodeLenses(): Event<void> {
        return this.onDidChangeCodeLensesEmitter.event;
    }

    public provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
        if (!this.enabled || !document) {
            return Promise.resolve([]);
        }
        return this.server.symbolService.getSymbols(document)
        .then((symbolTable: SymbolTable) => {
            return symbolTable.symbols.map((info: Symbol) =>
                new ReferencesCodeLens(document, info));
        }, bubbleRejectedPromise);
    }
}
