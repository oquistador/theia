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

import { injectable, inject, named } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { EDITOR_CONTEXT_MENU } from '@theia/editor/lib/browser/editor-menu';
import { EditorAccess } from '@theia/editor/lib/browser/editor-manager';
import { AbstractViewContribution, OpenViewArguments } from '@theia/core/lib/browser/shell/view-contribution';
import { TypeHierarchyTreeWidget } from './tree/typehierarchy-tree-widget';
import { TypeHierarchyTree } from './tree/typehierarchy-tree';
import { TypeHierarchyService } from './typehierarchy-service';

@injectable()
export class TypeHierarchyContribution extends AbstractViewContribution<TypeHierarchyTreeWidget> {

    @inject(EditorAccess)
    @named(EditorAccess.CURRENT)
    protected readonly editorAccess: EditorAccess;

    @inject(TypeHierarchyService)
    protected readonly typeHierarchyService: TypeHierarchyService;

    constructor() {
        super({
            widgetId: TypeHierarchyTreeWidget.WIDGET_ID,
            widgetName: TypeHierarchyTreeWidget.WIDGET_LABEL,
            defaultWidgetOptions: {
                area: 'bottom'
            },
            toggleCommandId: TypeHierarchyCommands.TOGGLE_VIEW.id,
            toggleKeybinding: 'ctrlcmd+alt+h'
        });
    }

    async openView(args?: Partial<TypeHierarchyOpenViewArguments>): Promise<TypeHierarchyTreeWidget> {
        const widget = await super.openView(args);
        const { selection, languageId } = this.editorAccess;
        const type = this.getType(args);
        await widget.initialize({ selection, languageId, type });
        return widget;
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);
        commands.registerCommand(TypeHierarchyCommands.OPEN_SUBTYPE, {
            execute: () => this.openView({
                toggle: false,
                activate: true,
                type: 'subtype'
            }),
            isEnabled: this.isEnabled.bind(this)
        });
        commands.registerCommand(TypeHierarchyCommands.OPEN_SUPERTYPE, {
            execute: () => this.openView({
                toggle: false,
                activate: true,
                type: 'supertype'
            }),
            isEnabled: this.isEnabled.bind(this)
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
        const menuPath = [...EDITOR_CONTEXT_MENU, 'navigation'];
        menus.registerMenuAction(menuPath, {
            commandId: TypeHierarchyCommands.OPEN_SUBTYPE.id
        });
        menus.registerMenuAction(menuPath, {
            commandId: TypeHierarchyCommands.OPEN_SUPERTYPE.id
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        super.registerKeybindings(keybindings);
        keybindings.registerKeybinding({
            command: TypeHierarchyCommands.OPEN_SUBTYPE.id,
            keybinding: 'ctrlcmd+f1'
        });
    }

    protected isEnabled(languageId: string | undefined = this.editorAccess.languageId): boolean {
        return this.typeHierarchyService.isEnabledFor(languageId);
    }

    protected getType(args?: Partial<TypeHierarchyOpenViewArguments>): TypeHierarchyTree.Type {
        return !!args && !!args.type ? args.type : 'subtype';
    }

}

export interface TypeHierarchyOpenViewArguments extends OpenViewArguments {
    readonly type: TypeHierarchyTree.Type;
}

export namespace TypeHierarchyCommands {

    export const TOGGLE_VIEW: Command = {
        id: 'typehierarchy:toggle'
    };

    export const OPEN_SUBTYPE: Command = {
        id: 'typehierarchy:open-subtype',
        label: 'Open Subtype Hierarchy'
    };

    export const OPEN_SUPERTYPE: Command = {
        id: 'typehierarchy:open-supertype',
        label: 'Open Supertype Hierarchy'
    };

}
