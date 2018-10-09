/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { v4 } from 'uuid';
import { DisposableCollection } from '@theia/core/lib/common/';
import {
    ILanguageClient,
    TextDocumentFeature,
    TextDocumentRegistrationOptions,
    TextDocumentPositionParams,
    ClientCapabilities,
    ServerCapabilities,
    Disposable,
    DocumentSelector
} from '../index';
import { TypeHierarchyMessageType, DocumentSymbolExt, SubTypesRequest, SuperTypesRequest } from './typehierarchy-protocol';

// NOTE: This module can be removed, or at least can be simplified once the type hierarchy will become the part of the LSP.
// https://github.com/Microsoft/language-server-protocol/issues/582
// https://github.com/Microsoft/vscode-languageserver-node/pull/346#discussion_r221659062

/**
 * Abstract text document feature for handling super- and subtype hierarchies through the LSP.
 */
export abstract class TypeHierarchyFeature extends TextDocumentFeature<TextDocumentRegistrationOptions> {

    protected readonly languageId: string;
    protected readonly toDispose: DisposableCollection;

    protected constructor(
        client: ILanguageClient & Readonly<{ languageId: string }>,
        protected readonly options: TypeHierarchyFeature.Options) {

        super(client, options.messageType);
        this.languageId = client.languageId;
    }

    fillClientCapabilities(capabilities: ClientCapabilities): void {
        if (!capabilities.textDocument) {
            capabilities.textDocument = {};
        }
        // tslint:disable-next-line:no-any
        (capabilities.textDocument as any).typeHierarchyCapabilities = {
            typeHierarchy: true
        };
    }

    initialize(capabilities: ServerCapabilities, documentSelector: DocumentSelector): void {
        if (!documentSelector) {
            return;
        }
        const capabilitiesExt: ServerCapabilities & { typeHierarchy?: boolean } = capabilities;
        if (capabilitiesExt.typeHierarchy) {
            this.toDispose.push(this.options.initializeCallback(this.languageId));
            const id = v4();
            this.register(this.messages, {
                id,
                registerOptions: Object.assign({}, { documentSelector: documentSelector }, capabilitiesExt.typeHierarchy)
            });
        }
    }

    async get(params: TextDocumentPositionParams): Promise<DocumentSymbolExt | undefined> {
        const symbol = await this._client.sendRequest(this.options.messageType, params);
        return DocumentSymbolExt.is(symbol) ? symbol : undefined;
    }

    protected registerLanguageProvider(): Disposable {
        return Disposable.create(() => this.toDispose.dispose());
    }

}

export namespace TypeHierarchyFeature {

    export interface TypeHierarchyFeatureInitializeCallback {

        /**
         * Invoked when the connection between the client and the server has been established and the server send back
         * the `typeHierarchy` `true` information, so that it supports super- and subtype hierarchies.
         */
        (languageId: string): Disposable;

    }

    export interface Options {

        /**
         * The RPC message type.
         */
        readonly messageType: TypeHierarchyMessageType;

        /**
         * Callback function invoked when the connection between the language client and the server has been established and the
         * server set the `typeHierarchy` server capability to `true`.
         */
        readonly initializeCallback: TypeHierarchyFeature.TypeHierarchyFeatureInitializeCallback;

    }

}

/**
 * Text document feature for supertype hierarchies.
 */
export class SuperTypeHierarchyFeature extends TypeHierarchyFeature {

    constructor(
        client: ILanguageClient & Readonly<{ languageId: string }>,
        initializeCallback: TypeHierarchyFeature.TypeHierarchyFeatureInitializeCallback) {

        super(client, {
            messageType: SuperTypesRequest.type,
            initializeCallback
        });
    }

}

/**
 * Text document feature for subtype hierarchies.
 */
export class SubTypeHierarchyFeature extends TypeHierarchyFeature {

    constructor(
        client: ILanguageClient & Readonly<{ languageId: string }>,
        initializeCallback: TypeHierarchyFeature.TypeHierarchyFeatureInitializeCallback) {

        super(client, {
            messageType: SubTypesRequest.type,
            initializeCallback
        });
    }

}
