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
import { TreeWidget, TreeProps } from '@theia/core/lib/browser/tree/tree-widget';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { TypeHierarchyTreeModel } from './typehierarchy-tree-model';

@injectable()
export class TypeHierarchyTreeWidget extends TreeWidget {

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TypeHierarchyTreeModel) readonly model: TypeHierarchyTreeModel,
        @inject(ContextMenuRenderer) readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(props, model, contextMenuRenderer);
        this.id = TypeHierarchyTreeWidget.WIDGET_ID;
        this.title.label = TypeHierarchyTreeWidget.WIDGET_LABEL;
        this.title.caption = TypeHierarchyTreeWidget.WIDGET_LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-sitemap';
    }

}

export namespace TypeHierarchyTreeWidget {
    export const WIDGET_ID = 'theia-typehierarchy';
    export const WIDGET_LABEL = 'Type Hierarchy';
}
