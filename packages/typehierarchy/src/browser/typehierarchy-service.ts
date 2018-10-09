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

import { injectable } from 'inversify';
import { Disposable } from '@theia/core/lib/common/disposable';
import { ILanguageClient, TextDocumentPositionParams, TextDocumentIdentifier, Position } from '@theia/languages/lib/browser';
import { DocumentSymbolExt } from '@theia/languages/lib/browser/typehierarchy/typehierarchy-protocol';
import { SubTypeHierarchyFeature, SuperTypeHierarchyFeature, TypeHierarchyFeature } from '@theia/languages/lib/browser/typehierarchy/typehierarchy-feature';

@injectable()
export class TypeHierarchyService {

    protected readonly subTypeFeatures = new Map<string, SubTypeHierarchyFeature>();
    protected readonly superTypeFeatures = new Map<string, SuperTypeHierarchyFeature>();

    /**
     * `true` if the type hierarchy is supported for the given language. Otherwise, `false`.
     * It is always `false` for a given language unless the connection between the language client and the server has been established.
     */
    isEnabledFor(languageId: string): boolean {
        return this.subTypeFeatures.has(languageId) && this.superTypeFeatures.has(languageId);
    }

    createFeaturesFor(client: ILanguageClient & Readonly<{ languageId: string }>): [SubTypeHierarchyFeature, SuperTypeHierarchyFeature] {
        const subTypeFeature: SubTypeHierarchyFeature = new SubTypeHierarchyFeature(client, languageId => this.initFeature(languageId, subTypeFeature, this.subTypeFeatures));
        const superTypeFeature: SubTypeHierarchyFeature = new SubTypeHierarchyFeature(client, languageId => this.initFeature(languageId, superTypeFeature, this.superTypeFeatures));
        return [subTypeFeature, superTypeFeature];
    }

    async superTypes(languageId: string, symbol: DocumentSymbolExt): Promise<DocumentSymbolExt | undefined>;
    async superTypes(languageId: string, params: TextDocumentPositionParams): Promise<DocumentSymbolExt | undefined>;
    async superTypes(languageId: string, args: DocumentSymbolExt | TextDocumentPositionParams): Promise<DocumentSymbolExt | undefined> {
        return this.types(this.superTypeFeatures.get(languageId), args);
    }

    async subTypes(languageId: string, symbol: DocumentSymbolExt): Promise<DocumentSymbolExt | undefined>;
    async subTypes(languageId: string, params: TextDocumentPositionParams): Promise<DocumentSymbolExt | undefined>;
    async subTypes(languageId: string, args: DocumentSymbolExt | TextDocumentPositionParams): Promise<DocumentSymbolExt | undefined> {
        return this.types(this.subTypeFeatures.get(languageId), args);
    }

    protected async types(feature: TypeHierarchyFeature | undefined, args: DocumentSymbolExt | TextDocumentPositionParams): Promise<DocumentSymbolExt | undefined> {
        if (feature) {
            const params = this.isTextDocumentPositionParams(args) ? args : this.toTextDocumentPositionParams(args);
            return feature.get(params);
        }
        return undefined;
    }

    protected toTextDocumentPositionParams(symbol: DocumentSymbolExt): TextDocumentPositionParams {
        const position = symbol.selectionRange.start;
        const { uri } = symbol;
        return {
            position,
            textDocument: {
                uri
            }
        };
    }

    protected initFeature<T extends TypeHierarchyFeature>(languageId: string, newFeature: T, features: Map<string, T>): Disposable {
        const oldFeature = features.get(languageId);
        if (oldFeature) {
            oldFeature.dispose();
        }
        features.set(languageId, newFeature);
        return Disposable.create(() => {
            if (features.has(languageId)) {
                features.get(languageId)!.dispose();
            }
        });
    }

    // tslint:disable-next-line:no-any
    protected isTextDocumentPositionParams(args: any): args is TextDocumentPositionParams {
        return !!args
            && 'position' in args
            && 'textDocument' in args
            && Position.is(args['position'])
            && TextDocumentIdentifier.is(args['textDocument']);
    }

}
