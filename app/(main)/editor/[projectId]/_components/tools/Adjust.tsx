'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/context';
import { FabricImage, filters } from 'fabric';
import { Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

type FilterClassTypes =
    | typeof filters.Brightness
    | typeof filters.Contrast
    | typeof filters.Saturation
    | typeof filters.Vibrance
    | typeof filters.Blur
    | typeof filters.HueRotation;

type FilterConfigTypes = {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    filterClass: FilterClassTypes;
    valueKey: string;
    transform: (value: number) => number;
    suffix?: string;
};

// Filter configurations
const ADJUST_FILTER_CONFIG: FilterConfigTypes[] = [
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

const DEFAULT_VALUES: Record<string, number> = ADJUST_FILTER_CONFIG.reduce(
    (acc: Record<string, number>, config: FilterConfigTypes) => {
        acc[config.key] = config.defaultValue;
        return acc;
    },
    {}
);

const AdjustControl = () => {
    const [filterValues, setFilterValues] = useState(DEFAULT_VALUES);
    const [isApplying, setIsApplying] = useState(false);

    const { canvasEditor } = useCanvas();

    const getActiveImage = (): FabricImage | null => {
        if (!canvasEditor) return null;
        const activeObject = canvasEditor.getActiveObject();

        if (activeObject instanceof FabricImage) return activeObject;

        const objects = canvasEditor.getObjects();
        const imgObj = objects.find((obj) => obj instanceof FabricImage);
        return imgObj instanceof FabricImage ? imgObj : null;
    };

    const applyFilters = async (newValues: Record<string, number>) => {
        const imageObject = getActiveImage();
        if (!imageObject || isApplying) return;

        setIsApplying(true);

        try {
            const filtersToApply: any[] = [];

            ADJUST_FILTER_CONFIG.forEach((config: FilterConfigTypes) => {
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

    const handleValueChange = (filterKey: string, value: number[]) => {
        const newValues = { ...filterValues, [filterKey]: value[0] };
        setFilterValues(newValues);
        applyFilters(newValues);
    };

    const resetFilters = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Load an image to start adjusting</p>
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

            {/* filters */}
            {ADJUST_FILTER_CONFIG.map((config: FilterConfigTypes) => (
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
