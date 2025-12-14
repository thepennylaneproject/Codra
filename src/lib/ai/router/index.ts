/**
 * Smart Router Module
 * src/lib/ai/router/index.ts
 * 
 * Export all router functionality.
 */

export {
    SmartRouter,
    smartRouter,
    formatRouteExplanation,
    mapOutputTypeToTaskType,
    mapModeToQuality,
} from './smart-router';

export type {
    SmartRouterInput,
    SmartRouterResult,
    SmartRouterTaskType,
    SmartRouterQuality,
    RankedModel,
    RoutingTrace,
} from './smart-router';
