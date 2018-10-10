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
import { v4 } from 'uuid';
import { TreeImpl, TreeNode, CompositeTreeNode } from '@theia/core/lib/browser/tree/tree';
import { Location } from '@theia/editor/lib/browser/editor';
import { DocumentSymbolExt } from '@theia/languages/lib/browser/typehierarchy/typehierarchy-protocol';

@injectable()
export class TypeHierarchyTree extends TreeImpl {

    async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
        if (TypeHierarchyTree.Node.is(parent)) {
            if (parent.resolved) {
                return parent.children.slice();
            }
        }
        return [];
    }

}

export namespace TypeHierarchyTree {

    export type Type = 'subtype' | 'supertype';

    export interface InitOptions {
        readonly type: Type;
        readonly selection: Location | undefined;
        readonly languageId: string | undefined;
    }

    export interface Node extends CompositeTreeNode {
        readonly type: Type;
        readonly location: Location;
        resolved?: boolean;
    }

    export namespace Node {

        export function is(node: TreeNode | undefined): node is Node {
            if (!!node && 'type' in node && 'location' in node) {
                // tslint:disable-next-line:no-any
                const { type, location } = (node as any);
                return Location.is(location) && (type === 'subtype' || type === 'supertype');
            }
            return false;
        }

        export function create(symbol: DocumentSymbolExt, type: Type, resolved?: boolean): Node {
            const id = v4();
            const { name } = symbol;
            const description = symbol.detail;
            const parent = undefined;
            const location = Location.create(symbol.uri, symbol.range);
            const children = symbol.children ? symbol.children.filter(DocumentSymbolExt.is).map(child => create(child, type, false)) : [];
            return {
                id,
                name,
                description,
                parent,
                location,
                type,
                resolved,
                children
            };
        }

    }

}
