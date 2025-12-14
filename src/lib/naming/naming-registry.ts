/**
 * NAMING REGISTRY
 * Central registry for all names in a project
 * Handles collision detection, style enforcement, and refactoring
 */

import { supabase } from '../supabase';
import type { NameRecord, NamingScope, NamingTargetType } from '../../types/architect';
import {
    NamingValidation,
    NamingRules,
    getDefaultRules,
    matchesCaseStyle,
    convertToCase
} from './naming-context';

export { type NamingValidation, type NamingRules };

export const namingRegistry = {
    /**
     * Register a new name
     */
    async register(
        projectId: string,
        name: string,
        kind: NamingTargetType,
        scope: NamingScope,
        options?: {
            description?: string;
            artifactId?: string;
            taskId?: string;
            createdBy?: 'agent' | 'user';
        }
    ): Promise<NameRecord | null> {
        // Check for collision first
        const collision = await this.checkCollision(projectId, name, kind);
        if (collision) {
            console.error(`Name collision: "${name}" already exists as ${kind}`);
            return null;
        }

        const { data, error } = await supabase
            .from('name_registry')
            .insert({
                project_id: projectId,
                name,
                kind,
                scope,
                description: options?.description,
                artifact_id: options?.artifactId,
                task_id: options?.taskId,
                created_by: options?.createdBy || 'user',
            })
            .select()
            .single();

        if (error) {
            console.error('Error registering name:', error);
            return null;
        }

        return data as NameRecord;
    },

    /**
     * Check if a name would collide
     */
    async checkCollision(
        projectId: string,
        name: string,
        kind: NamingTargetType
    ): Promise<NameRecord | null> {
        const { data } = await supabase
            .from('name_registry')
            .select('*')
            .eq('project_id', projectId)
            .eq('kind', kind)
            .ilike('name', name)
            .single();

        return data as NameRecord | null;
    },

    /**
     * Get all names for a project
     */
    async getProjectNames(
        projectId: string,
        filters?: { kind?: NamingTargetType; scope?: NamingScope }
    ): Promise<NameRecord[]> {
        let query = supabase
            .from('name_registry')
            .select('*')
            .eq('project_id', projectId);

        if (filters?.kind) {
            query = query.eq('kind', filters.kind);
        }
        if (filters?.scope) {
            query = query.eq('scope', filters.scope);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching names:', error);
            return [];
        }

        return data as NameRecord[];
    },

    /**
     * Validate a name against rules
     */
    validateName(
        name: string,
        kind: NamingTargetType,
        scope: NamingScope,
        customRules?: Partial<NamingRules>
    ): NamingValidation {
        const rules = {
            ...getDefaultRules(scope, kind),
            ...customRules,
        };

        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Length checks
        if (name.length < rules.minLength) {
            errors.push(`Name must be at least ${rules.minLength} characters`);
        }
        if (name.length > rules.maxLength) {
            errors.push(`Name must be at most ${rules.maxLength} characters`);
        }

        // Case style check
        if (!matchesCaseStyle(name, rules.caseStyle)) {
            errors.push(`Name should be in ${rules.caseStyle} case`);
            suggestions.push(`Try: ${convertToCase(name, rules.caseStyle)}`);
        }

        // Prefix/suffix check
        if (rules.prefix && !name.startsWith(rules.prefix)) {
            warnings.push(`Names of this type usually start with "${rules.prefix}"`);
            suggestions.push(`Try: ${rules.prefix}${name}`);
        }
        if (rules.suffix && !name.endsWith(rules.suffix)) {
            warnings.push(`Names of this type usually end with "${rules.suffix}"`);
        }

        // Banned tokens
        const usedBannedTokens = rules.bannedTokens.filter(token =>
            name.toLowerCase().includes(token.toLowerCase())
        );
        if (usedBannedTokens.length > 0) {
            warnings.push(`Avoid using: ${usedBannedTokens.join(', ')}`);
        }

        // Reserved names
        if (rules.reservedNames.includes(name.toLowerCase())) {
            errors.push(`"${name}" is a reserved name`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions,
        };
    },

    /**
     * Rename an entity across the project
     */
    async rename(
        projectId: string,
        oldName: string,
        newName: string,
        kind: NamingTargetType
    ): Promise<{ success: boolean; updatedReferences: number }> {
        // Find the name record
        const { data: record } = await supabase
            .from('name_registry')
            .select('*')
            .eq('project_id', projectId)
            .eq('name', oldName)
            .eq('kind', kind)
            .single();

        if (!record) {
            return { success: false, updatedReferences: 0 };
        }

        // Check new name doesn't collide
        const collision = await this.checkCollision(projectId, newName, kind);
        if (collision) {
            return { success: false, updatedReferences: 0 };
        }

        // Update the registry
        const { error } = await supabase
            .from('name_registry')
            .update({ name: newName })
            .eq('id', record.id);

        if (error) {
            return { success: false, updatedReferences: 0 };
        }

        // TODO: Update references in artifacts, prompts, etc.
        // This would require parsing content and replacing occurrences

        return { success: true, updatedReferences: 1 };
    },

    /**
     * Delete a name from registry
     */
    async unregister(projectId: string, name: string, kind: NamingTargetType): Promise<boolean> {
        const { error } = await supabase
            .from('name_registry')
            .delete()
            .eq('project_id', projectId)
            .eq('name', name)
            .eq('kind', kind);

        return !error;
    },
};
