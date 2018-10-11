/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
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

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Some entities copied and modified from https://github.com/Microsoft/vscode/blob/master/src/vs/vscode.d.ts
// Some entities copied and modified from https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/parts/debug/common/debug.ts

import { Disposable } from '@theia/core';
import { DebugProtocol } from 'vscode-debugprotocol';
import { IJSONSchema } from '@theia/core/lib/common/json-schema';

/**
 * The WS endpoint path to the Debug service.
 */
export const DebugPath = '/services/debug';

/**
 * DebugService symbol for DI.
 */
export const DebugService = Symbol('DebugService');

/**
 * This service provides functionality to configure and to start a new debug adapter session.
 * The workflow is the following. If user wants to debug an application and
 * there is no debug configuration associated with the application then
 * the list of available providers is requested to create suitable debug configuration.
 * When configuration is chosen it is possible to alter the configuration
 * by filling in missing values or by adding/changing/removing attributes. For this purpose the
 * #resolveDebugConfiguration method is invoked. After that the debug adapter session will be started.
 */
export interface DebugService extends Disposable {
    /**
     * Finds and returns an array of registered debug types.
     * @returns An array of registered debug types
     */
    debugTypes(): Promise<string[]>;

    /**
     * Provides initial [debug configuration](#DebugConfiguration).
     * @param debugType The registered debug type
     * @returns An array of [debug configurations](#DebugConfiguration)
     */
    provideDebugConfigurations(debugType: string): Promise<DebugConfiguration[]>;

    /**
     * Provides the schema attributes.
     * @param debugType The registered debug type
     * @returns An JSON Schema describing the configuration attributes for the given debug type
     */
    getSchemaAttributes(debugType: string): Promise<IJSONSchema[]>;

    /**
     * Resolves a [debug configuration](#DebugConfiguration) by filling in missing values
     * or by adding/changing/removing attributes.
     * @param debugConfiguration The [debug configuration](#DebugConfiguration) to resolve.
     * @returns The resolved debug configuration.
     */
    resolveDebugConfiguration(config: DebugConfiguration): Promise<DebugConfiguration>;

    /**
     * Creates a new [debug adapter session](#DebugAdapterSession).
     * @param config The resolved [debug configuration](#DebugConfiguration).
     * @returns The identifier of the created [debug adapter session](#DebugAdapterSession).
     */
    create(config: DebugConfiguration): Promise<string>;

    /**
     * Stop a running session for the given session id.
     */
    stop(sessionId: string): Promise<void>;

    /**
     * Stop all running sessions.
     */
    stop(): Promise<void>;
}

export interface LaunchConfig {
    version: string;
    configurations: DebugConfiguration[];
}

/**
 * Configuration for a debug adapter session.
 */
export interface DebugConfiguration {
    /**
     * The type of the debug adapter session.
     */
    type: string;

    /**
     * The name of the debug adapter session.
     */
    name: string;

    /**
     * Additional debug type specific properties.
     */
    [key: string]: any;
}

/**
 * The endpoint path to the debug adapter session.
 */
export const DebugAdapterPath = '/services/debug-adapter';

/**
 * Extension to the vscode debug protocol.
 *
 * FIXME: get rid of it, replace with proper frontend emitters
 */
export namespace ExtDebugProtocol {

    export interface Variable extends DebugProtocol.Variable {
        /** Parent variables reference. */
        parentVariablesReference: number;
    }

    /**
     * Event message for 'connected' event type.
     */
    export interface ConnectedEvent extends DebugProtocol.Event { }

    /**
     * Event message for 'variableUpdated' event type.
     */
    export interface VariableUpdatedEvent extends DebugProtocol.Event {
        body: {
            /** The variable's name. */
            name: string;
            /** The new value of the variable. */
            value: string;
            /** The type of the new value. Typically shown in the UI when hovering over the value. */
            type?: string;
            /** If variablesReference is > 0, the new value is structured and its children can be retrieved by passing variablesReference to the VariablesRequest. */
            variablesReference?: number;
            /** The number of named child variables. The client can use this optional information to present the variables in a paged UI and fetch them in chunks. */
            namedVariables?: number;
            /** The number of indexed child variables. The client can use this optional information to present the variables in a paged UI and fetch them in chunks. */
            indexedVariables?: number;
            /** Parent variables reference. */
            parentVariablesReference: number;
        }
    }

    /**
     * Exceptional breakpoint.
     */
    export interface ExceptionBreakpoint {
        /** ID of checked exception options returned via the 'exceptionBreakpointFilters' capability. */
        filter: string;
        /** Configuration options for exception. */
        exceptionOptions?: DebugProtocol.ExceptionOptions;
    }

    /**
     * The aggregated breakpoint.
     */
    export interface AggregatedBreakpoint {
        /**
         * Indicates that breakpoint is attached to the specific debug session.
         */
        sessionId?: string
        /**
         * Breakpoint created in setBreakpoints or setFunctionBreakpoints.
         */
        created?: DebugProtocol.Breakpoint;
        /**
         * A Source is a descriptor for source code.
         * If source is defined then breakpoint is a [SourceBreakpoint](#DebugProtocol.SourceBreakpoint)
         */
        source?: DebugProtocol.Source;
        /**
         * One of possible breakpoints.
         */
        origin: DebugProtocol.SourceBreakpoint | DebugProtocol.FunctionBreakpoint | ExtDebugProtocol.ExceptionBreakpoint;
    }
}
