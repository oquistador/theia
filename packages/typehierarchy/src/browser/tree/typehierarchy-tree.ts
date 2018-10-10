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

import { inject, injectable } from 'inversify';
import { v4 } from 'uuid';
import { Location } from '@theia/editor/lib/browser/editor';
import { SymbolKind } from '@theia/languages/lib/browser';
import { TreeImpl, TreeNode, CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode } from '@theia/core/lib/browser/tree';
import { DocumentSymbolExt } from '@theia/languages/lib/browser/typehierarchy/typehierarchy-protocol';
import { TypeHierarchyFeature } from '@theia/languages/lib/browser/typehierarchy/typehierarchy-feature';
import { TypeHierarchyService } from '@theia/typehierarchy/lib/browser/typehierarchy-service';

@injectable()
export class TypeHierarchyTree extends TreeImpl {

    @inject(TypeHierarchyService)
    protected readonly typeHierarchyService: TypeHierarchyService;

    async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
        if (TypeHierarchyTree.Node.is(parent)) {
            await this.ensureResolved(parent);
            if (parent.children.length === 0) {
                delete parent.children;
                delete parent.expanded;
                return [];
            }
            return parent.children.slice();
        }
        return [];
    }

    protected get languageId(): string | undefined {
        if (TypeHierarchyTree.RootNode.is(this.root)) {
            return this.root.languageId;
        }
        return undefined;
    }

    protected get type(): TypeHierarchyFeature.TypeHierarchyType | undefined {
        if (TypeHierarchyTree.RootNode.is(this.root)) {
            return this.root.type;
        }
        return undefined;
    }

    protected async ensureResolved(node: TypeHierarchyTree.Node): Promise<void> {
        if (!node.resolved) {
            const { languageId, type } = this;
            if (languageId && type) {
                const { location } = node;
                const resolvedSymbol = await (TypeHierarchyFeature.TypeHierarchyType.SUBTYPE === type
                    ? this.typeHierarchyService.subTypes(languageId, location)
                    : this.typeHierarchyService.superTypes(languageId, location));

                if (resolvedSymbol) {
                    node.resolved = true;
                    if (resolvedSymbol.children) {
                        node.children = resolvedSymbol.children.filter(DocumentSymbolExt.is).map(child => TypeHierarchyTree.Node.create(child));
                    } else {
                        node.children = [];
                    }
                }
            }
        }
    }

}

export namespace TypeHierarchyTree {

    export interface InitOptions {
        readonly type: TypeHierarchyFeature.TypeHierarchyType;
        readonly selection: Location | undefined;
        readonly languageId: string | undefined;
    }

    export interface RootNode extends Node {
        readonly type: TypeHierarchyFeature.TypeHierarchyType;
        readonly languageId: string;
    }

    export namespace RootNode {

        export function is(node: TreeNode | undefined): node is RootNode {
            if (Node.is(node) && 'type' in node && 'languageId' in node) {
                // tslint:disable-next-line:no-any
                const { type, languageId } = (node as any);
                return typeof languageId === 'string' && (type === TypeHierarchyFeature.TypeHierarchyType.SUBTYPE || type === TypeHierarchyFeature.TypeHierarchyType.SUPERTYPE);
            }
            return false;
        }

        export function create(symbol: DocumentSymbolExt, languageId: string, type: TypeHierarchyFeature.TypeHierarchyType): RootNode {
            return {
                ...Node.create(symbol, true),
                type,
                languageId
            };
        }

    }

    export interface Node extends CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode {
        readonly location: Location;
        readonly kind: SymbolKind;
        resolved: boolean;
    }

    export namespace Node {

        export function is(node: TreeNode | undefined): node is Node {
            if (!!node && 'resolved' in node && 'location' in node && 'kind' in node) {
                // tslint:disable-next-line:no-any
                const { resolved, location, kind } = (node as any);
                return Location.is(location) && typeof resolved === 'boolean' && typeof kind === 'number';
            }
            return false;
        }

        export function create(symbol: DocumentSymbolExt, resolved: boolean = true): Node {
            const id = v4();
            const { name } = symbol;
            const description = symbol.detail;
            const location = Location.create(symbol.uri, symbol.range);
            const kind = symbol.kind;
            const children = symbol.children ? symbol.children.filter(DocumentSymbolExt.is).map(child => create(child, false)) : [];
            return {
                id,
                name,
                description,
                parent: undefined,
                location,
                resolved,
                children,
                expanded: false,
                visible: true,
                selected: false,
                kind
            };
        }

    }

}
