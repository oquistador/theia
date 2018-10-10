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

import * as React from 'react';
import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { SymbolKind } from '@theia/languages/lib/browser';
import { TreeNode } from '@theia/core/lib/browser/tree/tree';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { TreeWidget, TreeProps, NodeProps } from '@theia/core/lib/browser/tree/tree-widget';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { TypeHierarchyTreeModel } from './typehierarchy-tree-model';
import { TypeHierarchyTree } from './typehierarchy-tree';

@injectable()
export class TypeHierarchyTreeWidget extends TreeWidget {

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TypeHierarchyTreeModel) readonly model: TypeHierarchyTreeModel,
        @inject(ContextMenuRenderer) readonly contextMenuRenderer: ContextMenuRenderer,
        @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
    ) {
        super(props, model, contextMenuRenderer);
        this.id = TypeHierarchyTreeWidget.WIDGET_ID;
        this.title.label = TypeHierarchyTreeWidget.WIDGET_LABEL;
        this.title.caption = TypeHierarchyTreeWidget.WIDGET_LABEL;
        this.addClass('theia-CallHierarchyTree');
        this.title.closable = true;
        this.title.iconClass = 'fa fa-sitemap';
    }

    async initialize(options: TypeHierarchyTree.InitOptions): Promise<void> {
        await this.model.initialize(options);
    }

    protected renderCaption(node: TreeNode, props: NodeProps): React.ReactNode {
        if (TypeHierarchyTree.Node.is(node)) {
            const location = this.labelProvider.getName(new URI(node.location.uri));
            return <div className='definitionNode'>
                <div className={'symbol-icon ' + this.toIconClass(node.kind)}></div>
                <div className='symbol'>
                    {node.name}
                </div>
                <div className='container'>
                    {location}
                </div>
            </div>;
        }
        return '';
    }

    protected toIconClass(symbolKind: number) {
        switch (symbolKind) {
            case SymbolKind.File: return 'file';
            case SymbolKind.Module: return 'module';
            case SymbolKind.Namespace: return 'namespace';
            case SymbolKind.Package: return 'package';
            case SymbolKind.Class: return 'class';
            case SymbolKind.Method: return 'method';
            case SymbolKind.Property: return 'property';
            case SymbolKind.Field: return 'field';
            case SymbolKind.Constructor: return 'constructor';
            case SymbolKind.Enum: return 'enum';
            case SymbolKind.Interface: return 'interface';
            case SymbolKind.Function: return 'function';
            case SymbolKind.Variable: return 'variable';
            case SymbolKind.Constant: return 'constant';
            case SymbolKind.String: return 'string';
            case SymbolKind.Number: return 'number';
            case SymbolKind.Boolean: return 'boolean';
            case SymbolKind.Array: return 'array';
            default: return 'unknown';
        }
    }

}

export namespace TypeHierarchyTreeWidget {
    export const WIDGET_ID = 'theia-typehierarchy';
    export const WIDGET_LABEL = 'Type Hierarchy';
}
