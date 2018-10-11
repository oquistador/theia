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

import { DebugProtocol } from 'vscode-debugprotocol';
import URI from '@theia/core/lib/common/uri';
import { ExtDebugProtocol } from '../common/debug-common';

export namespace DebugUtils {
    /**
     * Creates a unique breakpoint identifier based on its origin.
     * @param breakpoint the breakpoint
     * @returns the breakpoint unique identifier
     */
    export function makeBreakpointId(breakpoint: ExtDebugProtocol.AggregatedBreakpoint | DebugProtocol.Breakpoint): string {
        if ('origin' in breakpoint) {
            if (isSourceBreakpoint(breakpoint)) {
                return makeSourceBrkId(breakpoint.source!, breakpoint.origin as DebugProtocol.SourceBreakpoint);
            } else if (isFunctionBreakpoint(breakpoint)) {
                return makeFunctionBrkId(breakpoint.origin as DebugProtocol.FunctionBreakpoint);
            } else if (isExceptionBreakpoint(breakpoint)) {
                return makeExceptionBrkId(breakpoint.origin as ExtDebugProtocol.ExceptionBreakpoint);
            }
        } else if (!!breakpoint.source && !!breakpoint.line) {
            const sourceBreakpoint = {
                line: breakpoint.line,
                column: breakpoint.column
            };

            return makeSourceBrkId(breakpoint.source, sourceBreakpoint);
        }

        throw new Error('Unrecognized breakpoint type: ' + JSON.stringify(breakpoint));
    }

    export function isSourceBreakpoint(breakpoint: ExtDebugProtocol.AggregatedBreakpoint): boolean {
        return !!breakpoint.source;
    }

    export function isFunctionBreakpoint(breakpoint: ExtDebugProtocol.AggregatedBreakpoint): boolean {
        return 'name' in breakpoint.origin;
    }

    export function isExceptionBreakpoint(breakpoint: ExtDebugProtocol.AggregatedBreakpoint): boolean {
        return 'filter' in breakpoint.origin;
    }

    function makeExceptionBrkId(breakpoint: ExtDebugProtocol.ExceptionBreakpoint): string {
        return 'brk-exception-' + breakpoint.filter;
    }

    function makeFunctionBrkId(breakpoint: DebugProtocol.FunctionBreakpoint): string {
        return 'brk-function-' + breakpoint.name;
    }

    function makeSourceBrkId(source: DebugProtocol.Source, breakpoint: DebugProtocol.SourceBreakpoint): string {
        return 'brk-source-'
            // Accordingly to the spec either path or reference ought to be specified.
            + (source.path || source.sourceReference!)
            + `-${breakpoint.line}`
            + (breakpoint.column ? `:${breakpoint.column}` : '');
    }

    /**
     * Indicates if two entities has the same id.
     * @param left the left entity
     * @param right the right entity
     * @returns true if two entities have the same id otherwise it returns false
     */
    export function isEqual(left: { id: number } | number | undefined, right: { id: number } | number | undefined): boolean {
        return getId(left) === getId(right);
    }

    function getId(entity: { id: number } | number | undefined): number | undefined {
        if (typeof entity === 'number') {
            return entity;
        }
        return entity && entity.id;
    }

    /**
     * Converts the [source](#DebugProtocol.Source) to a [uri](#URI).
     * @param source the debug source
     * @returns an [uri](#URI) referring to the source
     */
    export function toUri(source: DebugProtocol.Source): URI {
        if (source.sourceReference && source.sourceReference > 0) {
            // Every source returned from the debug adapter has a name
            return new URI().withScheme('dap').withPath(source.name!).withQuery(source.sourceReference.toString());
        }

        if (source.path) {
            return new URI().withScheme('file').withPath(source.path);
        }

        throw new Error('Unrecognized source type: ' + JSON.stringify(source));
    }

    /**
     * Groups breakpoints by their source.
     * @param breakpoints the breakpoints to group
     * @return grouped breakpoints by their source
     */
    export function groupBySource(breakpoints: ExtDebugProtocol.AggregatedBreakpoint[]): Map<string, ExtDebugProtocol.AggregatedBreakpoint[]> {
        return breakpoints
            .filter(breakpoint => isSourceBreakpoint(breakpoint))
            .reduce((sourced, breakpoint) => {
                const uri = toUri(breakpoint.source!).toString();

                const arr = sourced.get(uri) || [];
                arr.push(breakpoint);
                sourced.set(uri, arr);

                return sourced;
            }, new Map<string, ExtDebugProtocol.AggregatedBreakpoint[]>());
    }

    /**
     * Indicates if the breakpoint has a source that refers to the same uri as provided.
     * @param breakpoint (breakpoint)[#ExtDebugProtocol.AggregatedBreakpoint]
     * @param uri (URI)[#URI]
     * @returns true breakpoint has a source that refers to the same uri otherwise function returns false
     */
    export function checkUri(breakpoint: ExtDebugProtocol.AggregatedBreakpoint, uri: URI): boolean {
        return toUri(breakpoint.source!).toString() === uri.toString();
    }

}
