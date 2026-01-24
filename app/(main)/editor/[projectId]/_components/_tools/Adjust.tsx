'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/context';
import { FabricImage, filters } from 'fabric';
import { Loader2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getActiveImage } from '../../_utils';
/**
 * Union of supported Fabric filter classes
 */
type AdjustFilterClassTypes =
    | typeof filters.Brightness
    | typeof filters.Contrast
    | typeof filters.Saturation
    | typeof filters.Vibrance
    | typeof filters.Blur
    | typeof filters.HueRotation;

/**
 * Configuration schema for each adjustable filter
 */
type AdjustFilterConfigTypes = {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    filterClass: AdjustFilterClassTypes;
    valueKey: string;
    transform: (value: number) => number;
    suffix?: string;
};

/**
 * Centralized filter definitions
 * UI sliders work in human-friendly ranges,
 * then get transformed into Fabric's expected values
 */
const ADJUST_FILTER_CONFIG: AdjustFilterConfigTypes[] = [
    {
        key: 'brightness',
        label: 'Brightness',
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Brightness,
        valueKey: 'brightness',
        transform: (value: number) => value / 100,
    },
    {
        key: 'contrast',
        label: 'Contrast',
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Contrast,
        valueKey: 'contrast',
        transform: (value: number) => value / 100,
    },
    {
        key: 'saturation',
        label: 'Saturation',
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Saturation,
        valueKey: 'saturation',
        transform: (value: number) => value / 100,
    },
    {
        key: 'vibrance',
        label: 'Vibrance',
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Vibrance,
        valueKey: 'vibrance',
        transform: (value: number) => value / 100,
    },
    {
        key: 'blur',
        label: 'Blur',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Blur,
        valueKey: 'blur',
        transform: (value: number) => value / 100,
    },
    {
        key: 'hue',
        label: 'Hue',
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
        filterClass: filters.HueRotation,
        valueKey: 'rotation',
        transform: (value: number) => value * (Math.PI / 180),
        suffix: '°',
    },
];

// Build default filter state dynamically from config
const DEFAULT_VALUES: Record<string, number> = ADJUST_FILTER_CONFIG.reduce(
    (acc: Record<string, number>, config: AdjustFilterConfigTypes) => {
        acc[config.key] = config.defaultValue;
        return acc;
    },
    {}
);

const AdjustControl = () => {
    const [filterValues, setFilterValues] = useState(DEFAULT_VALUES);
    const [isApplying, setIsApplying] = useState(false);

    const { canvasEditor } = useCanvas();

    // Apply filters to the active image based on UI state
    const applyFilters = async (newValues: Record<string, number>) => {
        const imageObject = getActiveImage(canvasEditor);
        if (!imageObject || isApplying) return;

        setIsApplying(true);

        try {
            const filtersToApply: any[] = [];

            ADJUST_FILTER_CONFIG.forEach((config: AdjustFilterConfigTypes) => {
                const value = newValues[config.key];

                if (value !== config.defaultValue) {
                    const transformedValue = config.transform(value);
                    filtersToApply.push(
                        new config.filterClass({
                            [config.valueKey]: transformedValue,
                        })
                    );
                }
            });

            imageObject.filters = filtersToApply;

            await new Promise<void>((resolve) => {
                imageObject.applyFilters();
                canvasEditor?.requestRenderAll();
                setTimeout(resolve, 50);
            });
        } catch (error) {
            console.error('Errors applying adjust filters: ', error);
        } finally {
            setIsApplying(false);
        }
    };

    // Handle slider changes
    const handleValueChange = (filterKey: string, value: number[]) => {
        const newValues = { ...filterValues, [filterKey]: value[0] };
        setFilterValues(newValues);
        applyFilters(newValues);
    };

    // Reset all filters back to defaults
    const resetFilters = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
    };

    // Extract UI slider values from an existing Fabric image
    // Used when re-selecting an image or restoring canvas state
    const extractFilterValues = (imageObject: FabricImage) => {
        if (!imageObject?.filters?.length) return DEFAULT_VALUES;

        const extractedValues = { ...DEFAULT_VALUES };

        imageObject.filters.forEach((filter: any) => {
            const config = ADJUST_FILTER_CONFIG.find(
                (c) => c.filterClass.name === filter.constructor.name
            );

            if (config) {
                const filterValue = filter[config.valueKey];
                if (config.key === 'hue') {
                    extractedValues[config.key] = Math.round(filterValue * (180 / Math.PI));
                } else {
                    extractedValues[config.key] = Math.round(filterValue * 100);
                }
            }
        });

        return extractedValues;
    };

    // Sync UI state with currently active image
    useEffect(() => {
        const imageObject = getActiveImage(canvasEditor);
        if (imageObject?.filters) {
            const existingValues = extractFilterValues(imageObject);
            setFilterValues(existingValues);
        }
    }, [canvasEditor]);

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Load an image to start adjusting</p>
            </div>
        );
    }

    const activeImage = getActiveImage(canvasEditor);
    if (!activeImage) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Select an image to adjust filters</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/*  reset button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white ">Image Adjustments</h3>{' '}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                    onClick={resetFilters}
                    disabled={isApplying}
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            </div>

            {/* filter controls */}
            {ADJUST_FILTER_CONFIG.map((config: AdjustFilterConfigTypes) => (
                <div key={config.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label>{config.label}</label>
                        <span className="text-xs text-white/70">
                            {filterValues[config.key]}
                            {config.suffix || ''}
                        </span>
                    </div>

                    <Slider
                        value={[filterValues[config.key]]}
                        onValueChange={(value: number[]) => handleValueChange(config.key, value)}
                        max={config.max}
                        min={config.min}
                        step={config.step}
                        className="w-full"
                    />
                </div>
            ))}

            {/* Info */}
            <div className="mt-6 p-3 bg-slate-700/50 rounded-lg">
                <div className="text-xs text-white/70">
                    Adjustments are applied in real-time. Use the Reset button to restore the
                    original values.
                </div>
            </div>

            {/* Processing Indicator */}
            {isApplying && (
                <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-xs text-white/70">Applying filters...</span>
                </div>
            )}
        </div>
    );
};

export default AdjustControl;
