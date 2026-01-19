'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/context';
import { IText } from 'fabric';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Italic,
    LucideIcon,
    Trash2,
    Type,
    Underline,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const FONT_FAMILIES = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Georgia',
    'Garamond',
    'Palatino',
    'Book Antiqua',
    'Courier New',
    'Courier',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
    'Comic Sans MS',
    'Lucida Sans',
    'Lucida Grande',
    'Lucida Console',
    'Segoe UI',
    'Calibri',
    'Candara',
    'Optima',
    'Futura',
    'Franklin Gothic Medium',
    'Century Gothic',
    'Cambria',
    'Consolas',
    'Monaco',
    'Didot',
    'Baskerville',
    'Rockwell',
    'Gill Sans',
    'Perpetua',
    'Copperplate',
    'Brush Script MT',
    'Symbol',
    'Webdings',
    'Wingdings',
] as const;

const FONT_SIZES = { min: 8, max: 120, default: 20 };

type FontFamilyTypes = (typeof FONT_FAMILIES)[number];
type TextAlignTypes = 'left' | 'center' | 'right' | 'justify';
type HexColorTypes = `#${string}`;
type TextFormattingTypes = 'bold' | 'italic' | 'underline';

const TEXT_ALIGN_OPTIONS: readonly [TextAlignTypes, LucideIcon][] = [
    ['left', AlignLeft],
    ['center', AlignCenter],
    ['right', AlignRight],
    ['justify', AlignJustify],
];

const TEXT_FORMATTING_OPTIONS: readonly [TextFormattingTypes, LucideIcon][] = [
    ['bold', Bold],
    ['italic', Italic],
    ['underline', Underline],
];

type FormattingStateTypes = {
    bold: boolean;
    italic: boolean;
    underline: boolean;
};

const TextControls = () => {
    const { canvasEditor } = useCanvas();

    const [selectedText, setSelectedText] = useState<IText | null>(null); // Currently selected text object
    const [fontFamily, setFontFamily] = useState<FontFamilyTypes>('Arial'); // Current font family
    const [fontSize, setFontSize] = useState<number>(FONT_SIZES.default); // Current font size
    const [textColor, setTextColor] = useState<HexColorTypes>('#000000'); // Current text color
    const [textAlign, setTextAlign] = useState<TextAlignTypes>('left'); // Current text alignment
    const [formatting, setFormatting] = useState<FormattingStateTypes>({
        bold: false,
        italic: false,
        underline: false,
    });

    const updateSelectedText = () => {
        if (!canvasEditor) return;

        const activeObject = canvasEditor.getActiveObject();

        if (activeObject && activeObject instanceof IText) {
            setSelectedText(activeObject);

            // Sync UI controls with the selected text's current properties
            setFormatting({
                bold: activeObject.fontWeight === 'bold',
                italic: activeObject.fontStyle === 'italic',
                underline: activeObject.underline === true,
            });

            setFontFamily(
                FONT_FAMILIES.includes(activeObject.fontFamily as FontFamilyTypes)
                    ? (activeObject.fontFamily as FontFamilyTypes)
                    : 'Arial'
            );

            setFontSize(activeObject.fontSize ?? FONT_SIZES.default);
            setTextColor(
                typeof activeObject.fill === 'string'
                    ? (activeObject.fill as HexColorTypes)
                    : '#000000'
            );
            setTextAlign((activeObject.textAlign as TextAlignTypes) ?? 'left');
        } else {
            // No text selected, clear the selectedText state
            setSelectedText(null);
            setFormatting({ bold: false, italic: false, underline: false });
        }
    };

    useEffect(() => {
        if (!canvasEditor) return;

        updateSelectedText();

        const handleSelectionCreated = () => updateSelectedText(); // When user selects an object
        const handleSelectionUpdated = () => updateSelectedText(); // When selection changes to different object
        const handleSelectionCleared = () => setSelectedText(null); // When user deselects everything

        canvasEditor.on('selection:created', handleSelectionCreated);
        canvasEditor.on('selection:updated', handleSelectionUpdated);
        canvasEditor.on('selection:cleared', handleSelectionCleared);

        return () => {
            canvasEditor.off('selection:created', handleSelectionCreated);
            canvasEditor.off('selection:updated', handleSelectionUpdated);
            canvasEditor.off('selection:cleared', handleSelectionCleared);
        };
    }, [canvasEditor]);

    const addText = () => {
        if (!canvasEditor) return;

        const text = new IText('Edit this text', {
            left: canvasEditor.width / 2, // Center horizontally
            top: canvasEditor.height / 2, // Center vertically
            originX: 'center', // Use center as horizontal origin point
            originY: 'center', // Use center as vertical origin point
            fontFamily, // Use current font family setting
            fontSize, // Use current font size setting
            fill: textColor, // Use current text color setting
            textAlign, // Use current text alignment setting
            editable: true, // Allow direct text editing on canvas
            selectable: true, // Allow object select and transformation
        });

        canvasEditor.add(text);
        canvasEditor.setActiveObject(text);
        canvasEditor.requestRenderAll(); // Trigger canvas re-render

        setTimeout(() => {
            text.enterEditing(); // Switch to Text editing mode
            text.selectAll(); // Select all text for immediate editing
        }, 100);
    };

    const applyFontFamily = (family: FontFamilyTypes) => {
        if (!selectedText) return;
        setFontFamily(family); // Update local state
        selectedText.set('fontFamily', family); // Update fabric's object property
        canvasEditor?.requestRenderAll();
    };

    const applyFontSize = (size: number | number[]) => {
        if (!selectedText) return;
        // Handle both direct and array values from Slider componant
        const newSize = Array.isArray(size) ? size[0] : size;
        setFontSize(newSize); // Update local state
        selectedText.set('fontSize', newSize); // Update fabric.js object
        canvasEditor?.requestRenderAll();
    };

    const applyTextAlignment = (align: TextAlignTypes) => {
        if (!selectedText) return;
        setTextAlign(align);
        selectedText.set('textAlign', align);
        canvasEditor?.requestRenderAll();
    };

    const applyTextColor = (color: string) => {
        if (!selectedText) return;
        setTextColor(color as HexColorTypes);
        selectedText.set('fill', color);
        canvasEditor?.requestRenderAll();
    };

    const toggleFormat = (format: TextFormattingTypes) => {
        if (!selectedText) return;

        setFormatting((prev) => {
            const next = { ...prev, [format]: !prev[format] };

            // Apply side-effects to Fabric
            if (format === 'bold') {
                selectedText.set('fontWeight', next.bold ? 'bold' : 'normal');
            }

            if (format === 'italic') {
                selectedText.set('fontStyle', next.italic ? 'italic' : 'normal');
            }

            if (format === 'underline') {
                selectedText.set('underline', next.underline);
            }

            canvasEditor?.requestRenderAll();
            return next;
        });
    };

    const deleteSelectedText = () => {
        if (!canvasEditor || !selectedText) return;

        canvasEditor.remove(selectedText); // Remove from canvas
        canvasEditor.requestRenderAll(); // Re-render canvas
        setSelectedText(null);
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-white mb-2">Add Text</h3>
                    <p className="text-xs text-white/70 mb-4">
                        Click to add editable text to your canvas
                    </p>
                </div>
                <Button variant="primary" className="w-full" onClick={addText}>
                    <Type className="h-4 w-4 mr-2" />
                    Add Text
                </Button>
            </div>

            {selectedText && (
                <div className="border-t border-white/10 pt-6">
                    <h3 className="text-sm font-medium text-white mb-4">Edit Selected Text</h3>

                    {/* FONT FAMILY SELECT */}
                    <div className="space-y-2 mb-5">
                        <label id="font_family" className="text-xs text-white/70">
                            Font Family
                        </label>
                        <Select
                            value={fontFamily}
                            onValueChange={(family) => applyFontFamily(family as FontFamilyTypes)}
                        >
                            <SelectTrigger className="w-full my-2">
                                <SelectValue placeholder="Arial" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Font Family</SelectLabel>
                                    {FONT_FAMILIES.map((font) => (
                                        <SelectItem key={font} value={font}>
                                            {font}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* FONT SIZE SLIDER */}
                    <div className="space-y-2 mb-5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-white/70">Font Size</label>
                            <span className="text-xs text-white/70">{fontSize} px</span>
                        </div>
                        <Slider
                            value={[fontSize]}
                            onValueChange={applyFontSize}
                            min={FONT_SIZES.min}
                            max={FONT_SIZES.max}
                            step={1}
                            className="w-full my-3"
                        />
                    </div>

                    {/* TEXT ALIGNMENT */}
                    <div className="space-y-2 mb-5">
                        <label className="text-xs text-white/70">Text Alignment</label>
                        <div className="grid grid-cols-4 gap-1 my-2">
                            {TEXT_ALIGN_OPTIONS.map(([align, Icon]) => (
                                <Button
                                    key={align}
                                    onClick={() => applyTextAlignment(align)}
                                    variant={textAlign === align ? 'default' : 'outline'} // Active state styling
                                    size="sm"
                                    className="p-2"
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* TEXT COLOR */}
                    <div className="space-y-2 mb-5">
                        <label className="text-xs text-white/70">Text Color</label>
                        <div className="flex gap-2 my-2">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => applyTextColor(e.target.value)}
                                className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer"
                            />
                            {/* Text input for manual hex entry */}
                            <Input
                                value={textColor}
                                onChange={(e) => applyTextColor(e.target.value)}
                                placeholder="#000000"
                                className="flex-1 bg-slate-700 border-white/20 text-white text-sm"
                            />
                        </div>
                    </div>

                    {/* TEXT FORMATTING */}
                    <div className="space-y-2 mb-5">
                        <label className="text-xs text-white/70">Formatting</label>
                        <div className="flex gap-2 my-2">
                            {TEXT_FORMATTING_OPTIONS.map(([format, Icon]) => {
                                return (
                                    <Button
                                        key={format}
                                        onClick={() => toggleFormat(format)}
                                        variant={formatting[format] ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* DELETE BUTTON */}
                    <Button
                        onClick={deleteSelectedText}
                        variant="outline"
                        className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10 cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Text
                    </Button>
                </div>
            )}

            <div className="bg-slate-700/30 p-3 rounded-lg">
                <p className="text-xs text-white/70">
                    <strong>Double-click</strong> to edit it directly on canvas.
                    <br />
                    <strong>Select</strong> text to see formatting options here.
                </p>
            </div>
        </div>
    );
};

export default TextControls;
