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
import { TreeNode } from '@theia/core/lib/browser/tree/tree';
import { TreeModelImpl } from '@theia/core/lib/browser/tree/tree-model';
import { TypeHierarchyService } from '../typehierarchy-service';
import { TypeHierarchyTree } from './typehierarchy-tree';

@injectable()
export class TypeHierarchyTreeModel extends TreeModelImpl {

    @inject(TypeHierarchyService)
    protected readonly typeHierarchyService: TypeHierarchyService;

    protected doOpenNode(node: TreeNode): void {
        // do nothing (in particular do not expand the node)
    }

    async initialize(options: TypeHierarchyTree.InitOptions): Promise<void> {
        this.tree.root = undefined;
        const { selection, languageId, type } = options;
        if (languageId && selection) {
            const types = 'subtype' === type ? this.typeHierarchyService.subTypes : this.typeHierarchyService.superTypes;
            const symbol = await types(languageId, selection);
            if (symbol) {
                this.tree.root = TypeHierarchyTree.Node.create(symbol, type);
            }
        }
    }

}
