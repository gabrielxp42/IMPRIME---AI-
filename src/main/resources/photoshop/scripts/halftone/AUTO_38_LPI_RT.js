// Copyright: 2025 TEC-DTF - RIO DE JANEIRO - Todos os direitos reservados - Lei 9.610 (BR)
// Nenhuma parte deste script, manual, ou qualquer outro arquivo incluído pode ser copiado, redistribuído, vendido, compartilhado ou incluído em outro produto.
// Date: 2025-09-06T18:35:51-03:00
// Contato: contato@tecdtf.com.br
//
// Action set: Halftone Roseta 38 LPI

// jamEngine.jsxinc v4.4.4 (minified)
if (typeof jamEngine !== 'object') {
    var jamEngine = {};
    (function() {
        var that;
        jamEngine.meaningfulIds = false;
        jamEngine.parseFriendly = false;
        jamEngine.displayDialogs = DialogModes.ERROR;
        var conflictingStringIdStrs = {
            "'Algn'": ["align", "alignment"],
            "'AntA'": ["antiAlias", "antiAliasedPICTAcquire"],
            "'BckL'": ["backgroundLayer", "backgroundLevel"],
            "'BlcG'": ["blackGenerationType", "blackGenerationCurve"],
            "'BlcL'": ["blackLevel", "blackLimit"],
            "'Blks'": ["blacks", "blocks"],
            "'BlrM'": ["blurMethod", "blurMore"],
            "'BrgC'": ["brightnessEvent", "brightnessContrast"],
            "'BrsD'": ["brushDetail", "brushesDefine"],
            "'Brsh'": ["brush", "brushes"],
            "'Clcl'": ["calculation", "calculations"],
            "'ClrP'": ["colorPalette", "coloredPencil"],
            "'Cnst'": ["constant", "constrain"],
            "'CntC'": ["centerCropMarks", "conteCrayon"],
            "'Cntr'": ["center", "contrast"],
            "'CrtD'": ["createDroplet", "createDuplicate"],
            "'CstP'": ["customPalette", "customPhosphors"],
            "'Cstm'": ["custom", "customPattern"],
            "'Drkn'": ["darken", "darkness"],
            "'Dstr'": ["distort", "distortion", "distribute", "distribution"],
            "'Dstt'": ["desaturate", "destWhiteMax"],
            "'FlIn'": ["fileInfo", "fillInverse"],
            "'Gd  '": ["good", "guide"],
            "'GnrP'": ["generalPreferences", "generalPrefs", "preferencesClass"],
            "'GrSt'": ["grainStippled", "graySetup"],
            "'Grdn'": ["gradientClassEvent", "gridMinor"],
            "'Grn '": ["grain", "green"],
            "'Grns'": ["graininess", "greens"],
            "'HstP'": ["historyPreferences", "historyPrefs"],
            "'HstS'": ["historyState", "historyStateSourceType"],
            "'ImgP'": ["imageCachePreferences", "imagePoint"],
            "'In  '": ["in", "stampIn"],
            "'IntW'": ["interfaceWhite", "intersectWith"],
            "'Intr'": ["interfaceIconFrameDimmed", "interlace", "interpolation", "intersect"],
            "'JPEG'": ["JPEG", "JPEGFormat"],
            "'LghD'": ["lightDirection", "lightDirectional"],
            "'LghO'": ["lightOmni", "lightenOnly"],
            "'LghS'": ["lightSource", "lightSpot"],
            "'Lns '": ["lens", "lines"],
            "'Mgnt'": ["magenta", "magentas"],
            "'MrgL'": ["mergeLayers", "mergedLayers"],
            "'Mxm '": ["maximum", "maximumQuality"],
            "'NTSC'": ["NTSC", "NTSCColors"],
            "'NmbL'": ["numberOfLayers", "numberOfLevels"],
            "'PlgP'": ["pluginPicker", "pluginPrefs"],
            "'Pncl'": ["pencilEraser", "pencilWidth"],
            "'Pnt '": ["paint", "point"],
            "'Prsp'": ["perspective", "perspectiveIndex"],
            "'PrvM'": ["previewMacThumbnail", "previewMagenta"],
            "'Pstr'": ["posterization", "posterize"],
            "'RGBS'": ["RGBSetup", "RGBSetupSource"],
            "'Rds '": ["radius", "reds"],
            "'ScrD'": ["scratchDisks", "screenDot"],
            "'ShdI'": ["shadingIntensity", "shadowIntensity"],
            "'ShpC'": ["shapeCurveType", "shapingCurve"],
            "'ShrE'": ["sharpenEdges", "shearEd"],
            "'Shrp'": ["sharpen", "sharpness"],
            "'SplC'": ["splitChannels", "supplementalCategories"],
            "'Spot'": ["spot", "spotColor"],
            "'SprS'": ["separationSetup", "sprayedStrokes"],
            "'StrL'": ["strokeLength", "strokeLocation"],
            "'Strt'": ["saturation", "start"],
            "'TEXT'": ["char", "textType"],
            "'TIFF'": ["TIFF", "TIFFFormat"],
            "'TglO'": ["toggleOptionsPalette", "toggleOthers"],
            "'TrnG'": ["transparencyGamutPreferences", "transparencyGrid", "transparencyGridSize"],
            "'TrnS'": ["transferSpec", "transparencyShape", "transparencyStop"],
            "'Trns'": ["transparency", "transparent"],
            "'TxtC'": ["textClickPoint", "textureCoverage"],
            "'TxtF'": ["textureFile", "textureFill"],
            "'UsrM'": ["userMaskEnabled", "userMaskOptions"],
            "'c@#^'": ["inherits", "pInherits"],
            "'comp'": ["comp", "sInt64"],
            "'doub'": ["floatType", "IEEE64BitFloatingPoint", "longFloat"],
            "'long'": ["integer", "longInteger", "sInt32"],
            "'magn'": ["magnitude", "uInt32"],
            "'null'": ["null", "target"],
            "'shor'": ["sInt16", "sMInt", "shortInteger"],
            "'sing'": ["IEEE32BitFloatingPoint", "sMFloat", "shortFloat"]
        };
        jamEngine.getConflictingStringIdStrs = function(charIdStr) {
            return conflictingStringIdStrs[charIdStr] || null;
        };
        jamEngine.uniIdStrToId = function(uniIdStr) {
            var id = 0;
            if (typeof uniIdStr === 'string') {
                if ((uniIdStr.length === (1 + 4 + 1)) && (uniIdStr.charAt(0) === "'") && (uniIdStr.charAt(5) === "'")) {
                    id = app.charIDToTypeID(uniIdStr.substring(1, 5));
                } else {
                    id = app.stringIDToTypeID(uniIdStr);
                }
            }
            return id;
        };
        var smallestHashValue = app.charIDToTypeID("    ");
        jamEngine.idToUniIdStrs = function(id) {
            var charIdStr = "";
            var stringIdStr = app.typeIDToStringID(id);
            if (id >= smallestHashValue) {
                charIdStr = "'" + app.typeIDToCharID(id) + "'";
                if (stringIdStr !== "") {
                    if (charIdStr in conflictingStringIdStrs) {
                        stringIdStr = conflictingStringIdStrs[charIdStr];
                    }
                }
            }
            return [charIdStr, stringIdStr];
        };
        jamEngine.equivalentUniIdStrs = function(uniIdStr1, uniIdStr2) {
            return this.uniIdStrToId(uniIdStr1) === this.uniIdStrToId(uniIdStr2);
        };

        function putInReference(ref, containers) {
            if (containers.constructor === Array) {
                var count = containers.length;
                for (var i = 0; i < count; i++) {
                    var container = that.parseCompact(containers[i]);
                    var desiredClassId = that.uniIdStrToId(container[0]);
                    var typedValue = that.parseCompact(container[1]);
                    var form = typedValue[0];
                    var value = typedValue[1];
                    switch (form) {
                        case "<class>":
                            ref.putClass(desiredClassId);
                            break;
                        case "<enumerated>":
                            var enumerated = that.parseCompact(value);
                            ref.putEnumerated(desiredClassId, that.uniIdStrToId(enumerated[0]), that.uniIdStrToId(enumerated[1]));
                            break;
                        case "<identifier>":
                            ref.putIdentifier(desiredClassId, value);
                            break;
                        case "<index>":
                            ref.putIndex(desiredClassId, value);
                            break;
                        case "<name>":
                            ref.putName(desiredClassId, value);
                            break;
                        case "<offset>":
                            ref.putOffset(desiredClassId, value);
                            break;
                        case "<property>":
                            ref.putProperty(desiredClassId, that.uniIdStrToId(value));
                            break;
                        default:
                            throw new Error("[jamEngine putInReference] Unknown reference form: " + form);
                            break;
                    }
                }
            } else {
                throw new Error("[jamEngine putInReference] JavaScript array expected");
            }
        }

        function putInList(list, items) {
            if (items.constructor === Array) {
                var count = items.length;
                for (var i = 0; i < count; i++) {
                    var item = that.parseCompact(items[i]);
                    var type = item[0];
                    var value = item[1];
                    switch (type) {
                        case "<boolean>":
                            list.putBoolean(value);
                            break;
                        case "<class>":
                            list.putClass(that.uniIdStrToId(value));
                            break;
                        case "<data>":
                            list.putData(value);
                            break;
                        case "<double>":
                            list.putDouble(value);
                            break;
                        case "<enumerated>":
                            var enumerated = that.parseCompact(value);
                            list.putEnumerated(that.uniIdStrToId(enumerated[0]), that.uniIdStrToId(enumerated[1]));
                            break;
                        case "<integer>":
                            list.putInteger(value);
                            break;
                        case "<largeInteger>":
                            list.putLargeInteger(value);
                            break;
                        case "<list>":
                            var actionList = new ActionList();
                            putInList(actionList, value);
                            list.putList(actionList);
                            break;
                        case "<object>":
                            var object = that.parseCompact(value);
                            if (object[1]) {
                                var actionDescriptor = new ActionDescriptor();
                                putInDescriptor(actionDescriptor, object[1]);
                                list.putObject(that.uniIdStrToId(object[0]), actionDescriptor);
                            } else {
                                list.putClass(that.uniIdStrToId(object[0]));
                            }
                            break;
                        case "<path>":
                            var fileRef = new File(value);
                            list.putPath(fileRef);
                            break;
                        case "<reference>":
                            var actionReference = new ActionReference();
                            putInReference(actionReference, value);
                            list.putReference(actionReference);
                            break;
                        case "<string>":
                            list.putString(value);
                            break;
                        case "<unitDouble>":
                            var unitDouble = that.parseCompact(value);
                            list.putUnitDouble(that.uniIdStrToId(unitDouble[0]), unitDouble[1]);
                            break;
                        default:
                            throw new Error("[jamEngine putInList] Unknown list type: " + type);
                            break;
                    }
                }
            } else {
                throw new Error("[jamEngine putInList] JavaScript array expected");
            }
        }

        function putInDescriptor(desc, members) {
            if (members.constructor === Object) {
                for (var key in members) {
                    if (members.hasOwnProperty(key)) {
                        var keyID = that.uniIdStrToId(key);
                        var member = that.parseCompact(members[key]);
                        var type = member[0];
                        var value = member[1];
                        switch (type) {
                            case "<boolean>":
                                desc.putBoolean(keyID, value);
                                break;
                            case "<class>":
                                desc.putClass(keyID, that.uniIdStrToId(value));
                                break;
                            case "<data>":
                                desc.putData(keyID, value);
                                break;
                            case "<double>":
                                desc.putDouble(keyID, value);
                                break;
                            case "<enumerated>":
                                var enumerated = that.parseCompact(value);
                                desc.putEnumerated(keyID, that.uniIdStrToId(enumerated[0]), that.uniIdStrToId(enumerated[1]));
                                break;
                            case "<integer>":
                                desc.putInteger(keyID, value);
                                break;
                            case "<largeInteger>":
                                desc.putLargeInteger(keyID, value);
                                break;
                            case "<list>":
                                var actionList = new ActionList();
                                putInList(actionList, value);
                                desc.putList(keyID, actionList);
                                break;
                            case "<object>":
                                var object = that.parseCompact(value);
                                if (object[1]) {
                                    var actionDescriptor = new ActionDescriptor();
                                    putInDescriptor(actionDescriptor, object[1]);
                                    desc.putObject(keyID, that.uniIdStrToId(object[0]), actionDescriptor);
                                } else {
                                    desc.putClass(keyID, that.uniIdStrToId(object[0]));
                                }
                                break;
                            case "<path>":
                                var fileRef = new File(value);
                                desc.putPath(keyID, fileRef);
                                break;
                            case "<reference>":
                                var actionReference = new ActionReference();
                                putInReference(actionReference, value);
                                desc.putReference(keyID, actionReference);
                                break;
                            case "<string>":
                                desc.putString(keyID, value);
                                break;
                            case "<unitDouble>":
                                var unitDouble = that.parseCompact(value);
                                desc.putUnitDouble(keyID, that.uniIdStrToId(unitDouble[0]), unitDouble[1]);
                                break;
                            default:
                                throw new Error("[jamEngine putInDescriptor] Unknown descriptor type: " + type);
                                break;
                        }
                    }
                }
            } else {
                throw new Error("[jamEngine putInDescriptor] JavaScript object expected");
            }
        }
        var contextRules = {
            "'Algn'": {
                "<classKey>": {
                    "bevelEmboss": "align",
                    "frameFX": "align",
                    "gradientFill": "align",
                    "gradientLayer": "align",
                    "patternFill": "align",
                    "patternLayer": "align"
                },
                "<event>": "align",
                "<key>": "alignment"
            },
            "'AntA'": {
                "<class>": "antiAliasedPICTAcquire",
                "<key>": "antiAlias"
            },
            "'BckL'": {
                "<class>": "backgroundLayer",
                "<key>": "backgroundLevel"
            },
            "'BlcG'": {
                "<enumType>": "blackGenerationType",
                "<key>": "blackGenerationCurve"
            },
            "'BlcL'": {
                "<classKey>": {
                    "'GEfc'": "blackLevel",
                    "CMYKSetup": "blackLimit"
                },
                "<eventKey>": {
                    "reticulation": "blackLevel"
                }
            },
            "'Blks'": {
                "<typeValue>": {
                    "colors": "blacks",
                    "extrudeType": "blocks"
                }
            },
            "'BlrM'": {
                "<enumType>": "blurMethod",
                "<event>": "blurMore",
                "<key>": "blurMethod"
            },
            "'BrgC'": {
                "<class>": "brightnessContrast",
                "<event>": "brightnessContrast"
            },
            "'BrsD'": {
                "<enumValue>": "brushesDefine",
                "<key>": "brushDetail"
            },
            "'Brsh'": {
                "<class>": "brush",
                "<key>": "brushes"
            },
            "'Clcl'": {
                "<class>": "calculation",
                "<enumValue>": "calculations",
                "<key>": "calculation"
            },
            "'ClrP'": {
                "<typeValue>": {
                    "'GEft'": "coloredPencil"
                },
                "<enumType>": "colorPalette",
                "<event>": "coloredPencil"
            },
            "'Cnst'": {
                "<classKey>": {
                    "channelMatrix": "constant"
                },
                "<unknown>": "constrain"
            },
            "'CntC'": {
                "<typeValue>": {
                    "'GEft'": "conteCrayon"
                },
                "<event>": "conteCrayon",
                "<key>": "centerCropMarks"
            },
            "'Cntr'": {
                "<classKey>": {
                    "'GEfc'": "contrast",
                    "brightnessContrast": "contrast",
                    "document": "center",
                    "polygon": "center",
                    "quadrilateral": "center"
                },
                "<eventKey>": {
                    "adaptCorrect": "contrast",
                    "brightnessEvent": "contrast",
                    "grain": "contrast",
                    "halftoneScreen": "contrast",
                    "sumie": "contrast",
                    "tornEdges": "contrast",
                    "waterPaper": "contrast"
                },
                "<enumValue>": "center"
            },
            "'CrtD'": {
                "<enumValue>": "createDuplicate",
                "<event>": "createDroplet"
            },
            "'CstP'": {
                "<class>": "customPhosphors",
                "<key>": "customPalette"
            },
            "'Cstm'": {
                "<enumValue>": "customPattern",
                "<event>": "custom",
                "<key>": "custom"
            },
            "'Drkn'": {
                "<enumValue>": "darken",
                "<key>": "darkness"
            },
            "'Dstr'": {
                "<classKey>": {
                    "'GEfc'": "distortion"
                },
                "<eventKey>": {
                    "glass": "distortion",
                    "addNoise": "distribution"
                },
                "<enumType>": "distribution",
                "<enumValue>": "distort",
                "<event>": "distribute"
            },
            "'Dstt'": {
                "<enumValue>": "desaturate",
                "<event>": "desaturate",
                "<key>": "destWhiteMax"
            },
            "'FlIn'": {
                "<typeValue>": {
                    "fillColor": "fillInverse",
                    "menuItemType": "fileInfo"
                },
                "<class>": "fileInfo",
                "<key>": "fileInfo"
            },
            "'Gd  '": {
                "<class>": "guide",
                "<enumValue>": "good"
            },
            "'GnrP'": {
                "<class>": "preferencesClass",
                "<enumValue>": "generalPreferences",
                "<key>": "generalPrefs"
            },
            "'GrSt'": {
                "<class>": "graySetup",
                "<enumValue>": "grainStippled",
                "<key>": "graySetup"
            },
            "'Grdn'": {
                "<class>": "gradientClassEvent",
                "<event>": "gradientClassEvent",
                "<key>": "gridMinor"
            },
            "'Grn '": {
                "<typeValue>": {
                    "'GEft'": "grain"
                },
                "<classKey>": {
                    "'GEfc'": "grain",
                    "RGBColor": "green",
                    "blackAndWhite": "green",
                    "channelMatrix": "green",
                    "channelMixer": "green"
                },
                "<eventKey>": {
                    "blackAndWhite": "green",
                    "channelMixer": "green",
                    "filmGrain": "grain"
                },
                "<enumValue>": "green",
                "<event>": "grain"
            },
            "'Grns'": {
                "<enumValue>": "greens",
                "<key>": "graininess"
            },
            "'HstP'": {
                "<enumValue>": "historyPreferences",
                "<key>": "historyPrefs"
            },
            "'HstS'": {
                "<class>": "historyState",
                "<enumType>": "historyStateSourceType"
            },
            "'ImgP'": {
                "<class>": "imagePoint",
                "<enumValue>": "imageCachePreferences"
            },
            "'In  '": {
                "<enumValue>": "stampIn",
                "<key>": "in"
            },
            "'IntW'": {
                "<event>": "intersectWith",
                "<key>": "interfaceWhite"
            },
            "'Intr'": {
                "<typeValue>": {
                    "shapeOperation": "intersect"
                },
                "<classKey>": {
                    "GIFFormat": "interlace",
                    "SaveForWeb": "interlace",
                    "application": "interfaceIconFrameDimmed",
                    "computedBrush": "interpolation",
                    "dBrush": "interpolation",
                    "gradientClassEvent": "interpolation",
                    "photoshopEPSFormat": "interpolation",
                    "sampledBrush": "interpolation"
                },
                "<eventKey>": {
                    "convertMode": "interpolation",
                    "imageSize": "interpolation",
                    "transform": "interpolation"
                },
                "<event>": "intersect"
            },
            "'JPEG'": {
                "<class>": "JPEGFormat",
                "<enumValue>": "JPEG"
            },
            "'LghD'": {
                "<enumType>": "lightDirection",
                "<enumValue>": "lightDirectional",
                "<key>": "lightDirection"
            },
            "'LghO'": {
                "<typeValue>": {
                    "diffuseMode": "lightenOnly",
                    "lightType": "lightOmni"
                }
            },
            "'LghS'": {
                "<class>": "lightSource",
                "<enumValue>": "lightSpot",
                "<key>": "lightSource"
            },
            "'Lns '": {
                "<enumType>": "lens",
                "<enumValue>": "lines",
                "<key>": "lens"
            },
            "'Mgnt'": {
                "<typeValue>": {
                    "channel": "magenta",
                    "colors": "magentas",
                    "guideGridColor": "magenta"
                },
                "<key>": "magenta"
            },
            "'MrgL'": {
                "<enumValue>": "mergedLayers",
                "<event>": "mergeLayers"
            },
            "'Mxm '": {
                "<enumValue>": "maximumQuality",
                "<event>": "maximum",
                "<key>": "maximum"
            },
            "'NTSC'": {
                "<enumValue>": "NTSC",
                "<event>": "NTSCColors"
            },
            "'NmbL'": {
                "<classKey>": {
                    "'GEfc'": "numberOfLevels",
                    "document": "numberOfLayers"
                },
                "<eventKey>": {
                    "cutout": "numberOfLevels"
                }
            },
            "'PlgP'": {
                "<class>": "pluginPrefs",
                "<enumValue>": "pluginPicker",
                "<key>": "pluginPrefs"
            },
            "'Pncl'": {
                "<enumValue>": "pencilEraser",
                "<key>": "pencilWidth"
            },
            "'Pnt '": {
                "<typeValue>": {
                    "textType": "point"
                },
                "<class>": "point",
                "<event>": "paint"
            },
            "'Prsp'": {
                "<enumValue>": "perspective",
                "<key>": "perspectiveIndex"
            },
            "'PrvM'": {
                "<enumValue>": "previewMagenta",
                "<key>": "previewMacThumbnail"
            },
            "'Pstr'": {
                "<class>": "posterize",
                "<event>": "posterize",
                "<key>": "posterization"
            },
            "'RGBS'": {
                "<enumType>": "RGBSetupSource",
                "<key>": "RGBSetup"
            },
            "'Rds '": {
                "<enumValue>": "reds",
                "<key>": "radius"
            },
            "'ScrD'": {
                "<enumValue>": "screenDot",
                "<key>": "scratchDisks"
            },
            "'ShdI'": {
                "<classKey>": {
                    "'GEfc'": "shadowIntensity"
                },
                "<eventKey>": {
                    "watercolor": "shadowIntensity"
                },
                "<unknown>": "shadingIntensity"
            },
            "'ShpC'": {
                "<classKey>": {
                    "application": "shapingCurve"
                },
                "<class>": "shapingCurve",
                "<key>": "shapeCurveType"
            },
            "'ShrE'": {
                "<event>": "sharpenEdges",
                "<key>": "shearEd"
            },
            "'Shrp'": {
                "<event>": "sharpen",
                "<key>": "sharpness"
            },
            "'SplC'": {
                "<event>": "splitChannels",
                "<key>": "supplementalCategories"
            },
            "'Spot'": {
                "<enumValue>": "spotColor",
                "<key>": "spot"
            },
            "'SprS'": {
                "<typeValue>": {
                    "'GEft'": "sprayedStrokes"
                },
                "<enumValue>": "separationSetup",
                "<event>": "sprayedStrokes"
            },
            "'StrL'": {
                "<enumType>": "strokeLocation",
                "<key>": "strokeLength"
            },
            "'Strt'": {
                "<classKey>": {
                    "currentToolOptions": "saturation",
                    "fileNamingRules": "start",
                    "HSBColorClass": "saturation",
                    "hueSatAdjustment": "saturation",
                    "hueSatAdjustmentV2": "saturation",
                    "lineClass": "start",
                    "range": "start",
                    "vibrance": "saturation"
                },
                "<eventKey>": {
                    "replaceColor": "saturation",
                    "variations": "saturation",
                    "vibrance": "saturation"
                },
                "<enumValue>": "saturation"
            },
            "'TEXT'": {
                "<enumType>": "textType",
                "<key>": "textType"
            },
            "'TIFF'": {
                "<class>": "TIFFFormat",
                "<enumValue>": "TIFF"
            },
            "'TglO'": {
                "<enumValue>": "toggleOptionsPalette",
                "<key>": "toggleOthers"
            },
            "'TrnG'": {
                "<classKey>": {
                    "application": "transparencyGrid",
                    "transparencyPrefs": "transparencyGridSize"
                },
                "<enumType>": "transparencyGridSize",
                "<enumValue>": "transparencyGamutPreferences"
            },
            "'TrnS'": {
                "<classKey>": {
                    "bevelEmboss": "transparencyShape",
                    "dropShadow": "transparencyShape",
                    "innerGlow": "transparencyShape",
                    "innerShadow": "transparencyShape",
                    "outerGlow": "transparencyShape"
                },
                "<class>": "transparencyStop",
                "<unknown>": "transferSpec"
            },
            "'Trns'": {
                "<enumValue>": "transparent",
                "<key>": "transparency"
            },
            "'TxtC'": {
                "<classKey>": {
                    "'GEfc'": "textureCoverage",
                    "textLayer": "textClickPoint"
                },
                "<eventKey>": {
                    "underpainting": "textureCoverage"
                }
            },
            "'TxtF'": {
                "<event>": "textureFill",
                "<key>": "textureFile"
            },
            "'UsrM'": {
                "<enumType>": "userMaskOptions",
                "<key>": "userMaskEnabled"
            },
            "'null'": {
                "<class>": "null",
                "<enumValue>": "null",
                "<event>": "null",
                "<key>": "target"
            }
        };

        function getFromId(context, parentContext) {
            var uniIdStr;
            var kind = context[0];
            var id = context[1];
            if (id < smallestHashValue) {
                uniIdStr = app.typeIDToStringID(id);
            } else {
                uniIdStr = "'" + app.typeIDToCharID(id) + "'";
                if (that.meaningfulIds) {
                    if (uniIdStr in contextRules) {
                        function resolveIdStr(candidates) {
                            var idStr = "";
                            for (var parentString in candidates) {
                                if (candidates.hasOwnProperty(parentString)) {
                                    if (parentContext[1] === that.uniIdStrToId(parentString)) {
                                        idStr = candidates[parentString];
                                        break;
                                    }
                                }
                            }
                            return idStr;
                        }
                        var resolvedIdStr = "";
                        var rule = contextRules[uniIdStr];
                        if (parentContext) {
                            switch (kind) {
                                case "<key>":
                                    if ((parentContext[0] === "<class>") && ("<classKey>" in rule)) {
                                        resolvedIdStr = resolveIdStr(rule["<classKey>"]);
                                    } else if ((parentContext[0] === "<event>") && ("<eventKey>" in rule)) {
                                        resolvedIdStr = resolveIdStr(rule["<eventKey>"]);
                                    }
                                    break;
                                case "<enumValue>":
                                    if ((parentContext[0] === "<enumType>") && ("<typeValue>" in rule)) {
                                        resolvedIdStr = resolveIdStr(rule["<typeValue>"]);
                                    }
                                    break;
                            }
                        }
                        if (resolvedIdStr !== "") {
                            uniIdStr = resolvedIdStr;
                        } else if (kind in rule) {
                            uniIdStr = rule[kind];
                        }
                    } else {
                        var stringIDStr = app.typeIDToStringID(id);
                        if (stringIDStr !== "") {
                            uniIdStr = stringIDStr;
                        }
                    }
                }
            }
            return uniIdStr;
        }
        var incompatiblePlatformPath = "";
        var getEventId = app.stringIDToTypeID("get");
        var targetKeyId = app.stringIDToTypeID("target");
        var propertyClassId = app.stringIDToTypeID("property");

        function getFromReference(ref) {
            var propertyId = 0;
            var arr = [];
            do {
                try {
                    var desiredClassId = ref.getDesiredClass();
                } catch (e) {
                    break;
                }
                if (propertyId !== 0) {
                    var propertyCompact = that.buildCompact("<property>", getFromId(["<key>", propertyId], ["<class>", desiredClassId]));
                    arr.push(that.buildCompact(getFromId(["<class>", propertyClassId]), propertyCompact));
                    propertyId = 0;
                }
                var desiredCompact;
                var aFormID = ref.getForm();
                switch (aFormID) {
                    case ReferenceFormType.CLASSTYPE:
                        desiredCompact = that.buildCompact("<class>", null);
                        break;
                    case ReferenceFormType.ENUMERATED:
                        var enumTypeContext = ["<enumType>", ref.getEnumeratedType()];
                        var enumValueContext = ["<enumValue>", ref.getEnumeratedValue()];
                        desiredCompact = that.buildCompact("<enumerated>", that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext)));
                        break;
                    case ReferenceFormType.IDENTIFIER:
                        desiredCompact = that.buildCompact("<identifier>", ref.getIdentifier());
                        break;
                    case ReferenceFormType.INDEX:
                        desiredCompact = that.buildCompact("<index>", ref.getIndex());
                        break;
                    case ReferenceFormType.NAME:
                        desiredCompact = that.buildCompact("<name>", ref.getName());
                        break;
                    case ReferenceFormType.OFFSET:
                        desiredCompact = that.buildCompact("<offset>", ref.getOffset());
                        break;
                    case ReferenceFormType.PROPERTY:
                        if (desiredClassId === propertyClassId) {
                            propertyId = ref.getProperty();
                        } else {
                            desiredCompact = that.buildCompact("<property>", getFromId(["<key>", ref.getProperty()], ["<class>", desiredClassId]));
                        }
                        break;
                    default:
                        throw new Error("[jamEngine getFromReference] Unknown reference form type: " + aFormID);
                        break;
                }
                if (desiredClassId !== propertyClassId) {
                    arr.push(that.buildCompact(getFromId(["<class>", desiredClassId]), desiredCompact));
                }
                ref = ref.getContainer();
            } while (ref);
            return arr;
        }

        function getFromList(list) {
            var arr = [];
            var itemCount = list.count;
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                var itemCompact;
                var typeID;
                try {
                    typeID = list.getType(itemIndex);
                } catch (e) {
                    continue;
                }
                switch (typeID) {
                    case DescValueType.BOOLEANTYPE:
                        itemCompact = that.buildCompact("<boolean>", list.getBoolean(itemIndex));
                        break;
                    case DescValueType.CLASSTYPE:
                        itemCompact = that.buildCompact("<class>", getFromId(["<class>", list.getClass(itemIndex)]));
                        break;
                    case DescValueType.DOUBLETYPE:
                        itemCompact = that.buildCompact("<double>", list.getDouble(itemIndex));
                        break;
                    case DescValueType.ENUMERATEDTYPE:
                        var enumTypeContext = ["<enumType>", list.getEnumerationType(itemIndex)];
                        var enumValueContext = ["<enumValue>", list.getEnumerationValue(itemIndex)];
                        itemCompact = that.buildCompact("<enumerated>", that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext)));
                        break;
                    case DescValueType.INTEGERTYPE:
                        itemCompact = that.buildCompact("<integer>", list.getInteger(itemIndex));
                        break;
                    case DescValueType.LISTTYPE:
                        itemCompact = that.buildCompact("<list>", getFromList(list.getList(itemIndex)));
                        break;
                    case DescValueType.OBJECTTYPE:
                        var objectTypeContext = ["<class>", list.getObjectType(itemIndex)];
                        var objectValue = list.getObjectValue(itemIndex);
                        itemCompact = that.buildCompact("<object>", that.buildCompact(getFromId(objectTypeContext), getFromDescriptor(objectValue, objectTypeContext)));
                        break;
                    case DescValueType.ALIASTYPE:
                        try {
                            var fileRef = list.getPath(itemIndex);
                            itemCompact = that.buildCompact("<path>", fileRef.fsName);
                        } catch (e) {
                            itemCompact = that.buildCompact("<path>", incompatiblePlatformPath);
                        }
                        break;
                    case DescValueType.REFERENCETYPE:
                        itemCompact = that.buildCompact("<reference>", getFromReference(list.getReference(itemIndex)));
                        break;
                    case DescValueType.STRINGTYPE:
                        itemCompact = that.buildCompact("<string>", list.getString(itemIndex));
                        break;
                    case DescValueType.UNITDOUBLE:
                        var unitTypeContext = ["<unit>", list.getUnitDoubleType(itemIndex)];
                        var doubleValue = list.getUnitDoubleValue(itemIndex);
                        itemCompact = that.buildCompact("<unitDouble>", that.buildCompact(getFromId(unitTypeContext), doubleValue));
                        break;
                    default:
                        var isRawType;
                        var isLargeIntegerType;
                        try {
                            isRawType = (typeID === DescValueType.RAWTYPE);
                        } catch (e) {}
                        try {
                            isLargeIntegerType = (typeID === DescValueType.LARGEINTEGERTYPE);
                        } catch (e) {}
                        if (isRawType) {
                            itemCompact = that.buildCompact("<data>", list.getData(itemIndex));
                        } else if (isLargeIntegerType) {
                            itemCompact = that.buildCompact("<largeInteger>", list.getLargeInteger(itemIndex));
                        } else {
                            throw new Error("[jamEngine getFromList] Unknown descriptor value type: " + typeID);
                        }
                        break;
                }
                arr[itemIndex] = itemCompact;
            }
            return arr;
        }

        function getFromDescriptor(desc, parentContext) {
            if (desc) {
                var obj = {};
                var keyCount;
                try {
                    keyCount = desc.count;
                } catch (e) {
                    return null;
                }
                for (var keyIndex = 0; keyIndex < keyCount; keyIndex++) {
                    var keyID = desc.getKey(keyIndex);
                    var keyString = getFromId(["<key>", keyID], parentContext);
                    var keyCompact;
                    var typeID;
                    try {
                        typeID = desc.getType(keyID);
                    } catch (e) {
                        continue;
                    }
                    switch (typeID) {
                        case DescValueType.BOOLEANTYPE:
                            keyCompact = that.buildCompact("<boolean>", desc.getBoolean(keyID));
                            break;
                        case DescValueType.CLASSTYPE:
                            keyCompact = that.buildCompact("<class>", getFromId(["<class>", desc.getClass(keyID)]));
                            break;
                        case DescValueType.DOUBLETYPE:
                            keyCompact = that.buildCompact("<double>", desc.getDouble(keyID));
                            break;
                        case DescValueType.ENUMERATEDTYPE:
                            var enumTypeContext = ["<enumType>", desc.getEnumerationType(keyID)];
                            var enumValueContext = ["<enumValue>", desc.getEnumerationValue(keyID)];
                            keyCompact = that.buildCompact("<enumerated>", that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext)));
                            break;
                        case DescValueType.INTEGERTYPE:
                            keyCompact = that.buildCompact("<integer>", desc.getInteger(keyID));
                            break;
                        case DescValueType.LISTTYPE:
                            keyCompact = that.buildCompact("<list>", getFromList(desc.getList(keyID)));
                            break;
                        case DescValueType.OBJECTTYPE:
                            var objectTypeContext = ["<class>", desc.getObjectType(keyID)];
                            var objectValue = desc.getObjectValue(keyID);
                            keyCompact = that.buildCompact("<object>", that.buildCompact(getFromId(objectTypeContext), getFromDescriptor(objectValue, objectTypeContext)));
                            break;
                        case DescValueType.ALIASTYPE:
                            try {
                                var fileRef = desc.getPath(keyID);
                                keyCompact = that.buildCompact("<path>", fileRef.fsName);
                            } catch (e) {
                                keyCompact = that.buildCompact("<path>", incompatiblePlatformPath);
                            }
                            break;
                        case DescValueType.REFERENCETYPE:
                            keyCompact = that.buildCompact("<reference>", getFromReference(desc.getReference(keyID)));
                            break;
                        case DescValueType.STRINGTYPE:
                            keyCompact = that.buildCompact("<string>", desc.getString(keyID));
                            break;
                        case DescValueType.UNITDOUBLE:
                            var unitTypeContext = ["<unit>", desc.getUnitDoubleType(keyID)];
                            var doubleValue = desc.getUnitDoubleValue(keyID);
                            keyCompact = that.buildCompact("<unitDouble>", that.buildCompact(getFromId(unitTypeContext), doubleValue));
                            break;
                        default:
                            var isRawType;
                            var isLargeIntegerType;
                            try {
                                isRawType = (typeID === DescValueType.RAWTYPE);
                            } catch (e) {}
                            try {
                                isLargeIntegerType = (typeID === DescValueType.LARGEINTEGERTYPE);
                            } catch (e) {}
                            if (isRawType) {
                                keyCompact = that.buildCompact("<data>", desc.getData(keyID));
                            } else if (isLargeIntegerType) {
                                keyCompact = that.buildCompact("<largeInteger>", desc.getLargeInteger(keyID));
                            } else {
                                throw new Error("[jamEngine getFromDescriptor] Unknown descriptor value type: " + typeID);
                            }
                            break;
                    }
                    obj[keyString] = keyCompact;
                }
                return obj;
            } else {
                return null;
            }
        }
        jamEngine.jsonToActionDescriptor = function(descriptorObj) {
            that = this;
            var actionDescriptor;
            if (descriptorObj) {
                actionDescriptor = new ActionDescriptor();
                putInDescriptor(actionDescriptor, descriptorObj);
            }
            return actionDescriptor;
        };
        jamEngine.jsonToActionReference = function(referenceArr) {
            that = this;
            var actionReference;
            if (referenceArr) {
                actionReference = new ActionReference();
                putInReference(actionReference, referenceArr);
            }
            return actionReference;
        };
        jamEngine.eventIdAndActionDescriptorToJson = function(eventId, actionDescriptor) {
            that = this;
            var eventIdContext = ["<event>", eventId];
            return {
                "<event>": getFromId(eventIdContext),
                "<descriptor>": getFromDescriptor(actionDescriptor, eventIdContext)
            };
        };
        jamEngine.classIdAndActionDescriptorToJson = function(classId, actionDescriptor) {
            that = this;
            var classIdContext = ["<class>", classId];
            return {
                "<class>": getFromId(classIdContext),
                "<descriptor>": getFromDescriptor(actionDescriptor, classIdContext)
            };
        };
        jamEngine.actionReferenceToJson = function(actionReference) {
            that = this;
            return getFromReference(actionReference);
        };

        function getReferenceClassId(ref) {
            classId = 0;
            do {
                try {
                    var desiredClassId = ref.getDesiredClass();
                } catch (e) {
                    break;
                }
                if (desiredClassId !== propertyClassId) {
                    classId = desiredClassId;
                    break;
                }
                ref = ref.getContainer();
            } while (ref);
            return classId;
        }
        jamEngine.jsonPlay = function(eventUniIdStr, descriptorObj, displayDialogs) {
            var eventId = this.uniIdStrToId(eventUniIdStr);
            var desc = this.jsonToActionDescriptor(descriptorObj);
            var parentContext;
            if (eventId === getEventId) {
                var ref = desc.getReference(targetKeyId);
                parentContext = ["<class>", getReferenceClassId(ref)];
            } else {
                parentContext = ["<event>", eventId];
            }
            return getFromDescriptor(app.executeAction(eventId, desc, displayDialogs || this.displayDialogs), parentContext);
        };
        jamEngine.jsonGet = function(referenceArr) {
            var ref = this.jsonToActionReference(referenceArr);
            return getFromDescriptor(app.executeActionGet(ref), ["<class>", getReferenceClassId(ref)]);
        };
        jamEngine.normalizeJsonItem = function(item, options) {
            function normalizeItem(item) {
                var explicit = that.parseCompact(item);
                var type = explicit[0];
                var value = explicit[1];
                var normalizedValue;
                switch (type) {
                    case "<boolean>":
                    case "<data>":
                    case "<double>":
                    case "<identifier>":
                    case "<index>":
                    case "<integer>":
                    case "<largeInteger>":
                    case "<name>":
                    case "<offset>":
                    case "<path>":
                    case "<string>":
                        normalizedValue = value;
                        break;
                    case "<class>":
                        normalizedValue = value && getFromId(["<class>", that.uniIdStrToId(value)]);
                        break;
                    case "<enumerated>":
                        var enumerated = that.parseCompact(value);
                        var enumTypeContext = ["<enumType>", that.uniIdStrToId(enumerated[0])];
                        var enumValueContext = ["<enumValue>", that.uniIdStrToId(enumerated[1])];
                        normalizedValue = that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext));
                        break;
                    case "<list>":
                        normalizedValue = [];
                        for (var i = 0; i < value.length; i++) {
                            normalizedValue.push(normalizeItem(value[i]));
                        }
                        break;
                    case "<object>":
                        var object = that.parseCompact(value);
                        var objectClassContext = ["<class>", that.uniIdStrToId(object[0])];
                        var objectDescriptor = object[1];
                        var normalizedDescriptor;
                        if (objectDescriptor === null) {
                            normalizedDescriptor = null;
                        } else {
                            normalizedDescriptor = {};
                            for (var key in objectDescriptor) {
                                if (objectDescriptor.hasOwnProperty(key)) {
                                    var objectKeyContext = ["<key>", that.uniIdStrToId(key)];
                                    normalizedDescriptor[getFromId(objectKeyContext, objectClassContext)] = normalizeItem(objectDescriptor[key]);
                                }
                            }
                        }
                        normalizedValue = that.buildCompact(getFromId(objectClassContext), normalizedDescriptor);
                        break;
                    case "<property>":
                        normalizedValue = getFromId(["<key>", that.uniIdStrToId(value)]);
                        break;
                    case "<reference>":
                        normalizedValue = [];
                        for (var i = 0; i < value.length; i++) {
                            var container = that.parseCompact(value[i]);
                            normalizedValue.push(that.buildCompact(getFromId(["<class>", that.uniIdStrToId(container[0])]), normalizeItem(container[1])));
                        }
                        break;
                    case "<unitDouble>":
                        var unitDouble = that.parseCompact(value);
                        var unitTypeContext = ["<unit>", that.uniIdStrToId(unitDouble[0])];
                        normalizedValue = that.buildCompact(getFromId(unitTypeContext), unitDouble[1]);
                        break;
                    default:
                        throw new Error("[jamEngine.normalizeJsonItem] Unknown item type: " + type);
                        break;
                }
                return that.buildCompact(type, normalizedValue);
            }
            that = this;
            var saveMeaningfulIds = this.meaningfulIds;
            var saveParseFriendly = this.parseFriendly;
            if (options && (options.constructor === Object)) {
                if (typeof options.meaningfulIds !== 'undefined') {
                    this.meaningfulIds = options.meaningfulIds;
                }
                if (typeof options.parseFriendly !== 'undefined') {
                    this.parseFriendly = options.parseFriendly;
                }
            }
            var normalizedItem = normalizeItem(item);
            this.meaningfulIds = saveMeaningfulIds;
            this.parseFriendly = saveParseFriendly;
            return normalizedItem;
        };

        function simplifyRef(ref) {
            var simplifiedRef = [];
            for (var i = 0; i < ref.length; i++) {
                var element = ref[i];
                var simplifiedElement = {};
                var desiredClass = element[0];
                var form = element[1][0];
                var value = element[1][1];
                switch (form) {
                    case "<class>":
                    case "<identifier>":
                    case "<index>":
                    case "<name>":
                    case "<offset>":
                    case "<property":
                        simplifiedElement[desiredClass] = value;
                        break;
                    case "<enumerated>":
                        simplifiedElement[desiredClass] = value[1];
                        break;
                    default:
                        throw new Error("[jamEngine simplifyRef] Unexpected element form: " + form);
                        break;
                }
                simplifiedRef.push(simplifiedElement);
            }
            return simplifiedRef;
        }

        function simplifyItem(item, hook) {
            var simplifiedItem;
            var type = item[0];
            var value = item[1];
            switch (type) {
                case "<boolean>":
                case "<class>":
                case "<data>":
                case "<double>":
                case "<integer>":
                case "<largeInteger>":
                case "<path>":
                case "<string>":
                    simplifiedItem = value;
                    break;
                case "<list>":
                    simplifiedItem = simplifyList(value, hook);
                    break;
                case "<enumerated>":
                case "<unitDouble>":
                    simplifiedItem = value[1];
                    break;
                case "<object>":
                    simplifiedItem = simplifyDesc(value[1], hook);
                    break;
                case "<reference>":
                    simplifiedItem = simplifyRef(value);
                    break;
                default:
                    throw new Error("[jamEngine simplifyItem] Unexpected item type: " + type);
                    break;
            }
            return simplifiedItem;
        }

        function simplifyList(list, hook) {
            var simplifiedList = [];
            for (var i = 0; i < list.length; i++) {
                simplifiedList.push(simplifyItem(list[i], hook));
            }
            return simplifiedList;
        }

        function simplifyDesc(desc, hook) {
            var getDefaultValue = function(desc, key) {
                return simplifyItem(desc[key], hook);
            };
            var simplifiedDesc = {};
            for (var key in desc) {
                if (desc.hasOwnProperty(key)) {
                    var value = undefined;
                    if (typeof hook === 'function') {
                        value = hook(desc, key, getDefaultValue);
                    }
                    if (typeof value === 'undefined') {
                        value = simplifyItem(desc[key], hook);
                    }
                    simplifiedDesc[key] = value;
                }
            }
            return simplifiedDesc;
        }
        jamEngine.simplifyObject = function(object, hookFunction) {
            return simplifyDesc((this.normalizeJsonItem(object, {
                meaningfulIds: true,
                parseFriendly: true
            }))[1][1], hookFunction);
        };
        jamEngine.simplifyList = function(list, hookFunction) {
            return simplifyList((this.normalizeJsonItem(list, {
                meaningfulIds: true,
                parseFriendly: true
            }))[1], hookFunction);
        };
        jamEngine.parseCompact = function(compact) {
            var result = [];
            if (compact.constructor === Object) {
                var keys = [];
                for (var k in compact) {
                    if (compact.hasOwnProperty(k)) {
                        keys.push(k);
                    }
                }
                if (keys.length === 1) {
                    result[0] = keys[0];
                    result[1] = compact[keys[0]];
                } else {
                    throw new Error("[jamEngine.parseCompact] Syntax error: " + compact.toSource());
                }
            } else if (compact.constructor === Array) {
                if (compact.length === 2) {
                    result[0] = compact[0];
                    result[1] = compact[1];
                } else {
                    throw new Error("[jamEngine.parseCompact] Syntax error: " + compact.toSource());
                }
            } else {
                throw new Error("[jamEngine.parseCompact] JavaScript object or array expected");
            }
            return result;
        };
        jamEngine.compactToExplicit = function(compact, typeKey, valueKey) {
            var explicit = {};
            var typeValue = this.parseCompact(compact);
            explicit[typeKey || "<type>"] = typeValue[0];
            explicit[valueKey || "<value>"] = typeValue[1];
            return explicit;
        };
        jamEngine.buildCompact = function(type, value) {
            var compact;
            if (typeof type === 'string') {
                if (this.parseFriendly) {
                    compact = [type, value];
                } else {
                    compact = {};
                    compact[type] = value;
                }
            } else {
                throw new Error("[jamEngine.buildCompact] String expected");
            }
            return compact;
        };
        jamEngine.explicitToCompact = function(explicit, typeKey, valueKey) {
            var compact;
            if (explicit.constructor === Object) {
                compact = this.buildCompact(explicit[typeKey || "<type>"], explicit[valueKey || "<value>"]);
            } else {
                throw new Error("[jamEngine.explicitToCompact] JavaScript object expected");
            }
            return compact;
        };
        for (var charIdStr in conflictingStringIdStrs) {
            if (conflictingStringIdStrs.hasOwnProperty(charIdStr)) {
                var stringIdStrs = conflictingStringIdStrs[charIdStr];
                for (var index = stringIdStrs.length - 1; index >= 0; index--) {
                    var stringIdStr = stringIdStrs[index];
                    if (!(app.charIDToTypeID(charIdStr.substring(1, 5)) === app.stringIDToTypeID(stringIdStr))) {
                        stringIdStrs.splice(index, 1);
                    }
                }
                if (stringIdStrs.length < 2) {
                    delete conflictingStringIdStrs[charIdStr];
                }
            }
        }
        for (var charIdStr in contextRules) {
            if (contextRules.hasOwnProperty(charIdStr)) {
                if (charIdStr in conflictingStringIdStrs) {
                    var rule = contextRules[charIdStr];
                    for (var kind in rule) {
                        if (rule.hasOwnProperty(kind)) {
                            switch (kind) {
                                case "<class>":
                                case "<event>":
                                case "<enumType>":
                                case "<enumValue>":
                                case "<key>":
                                case "<unknown>":
                                    if (app.charIDToTypeID(charIdStr.substring(1, 5)) != app.stringIDToTypeID(rule[kind])) {
                                        throw new Error("[jamEngine] " + "\"" + charIdStr + "\" and \"" + rule[kind] + "\" are not equivalent ID strings");
                                    }
                                    break;
                                case "<classKey>":
                                case "<eventKey>":
                                case "<typeValue>":
                                    for (var parent in rule[kind]) {
                                        if (rule[kind].hasOwnProperty(parent)) {
                                            if (app.charIDToTypeID(charIdStr.substring(1, 5)) != app.stringIDToTypeID(rule[kind][parent])) {
                                                throw new Error("[jamEngine] " + "\"" + charIdStr + "\" and \"" + rule[kind][parent] + "\" are not equivalent ID strings");
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                    }
                } else {
                    delete contextRules[charIdStr];
                }
            }
        }
    }());
}

jamEngine.meaningfulIds = false;
jamEngine.parseFriendly = true;

// Action “Halftone Roseta 38 LPI”
try {
    // Stop
    jamEngine.jsonPlay(
        "'Stop'", {
            "'Msge'": [
                "<string>",
                "Redimensione a imagem para o tamanho da sua impressão final."
            ],
            "'Cntn'": [
                "<boolean>",
                true
            ]
        },
        DialogModes.ALL
    );
    // Image Size
    jamEngine.jsonPlay(
        "'ImgS'", {
            "'Rslt'": [
                "<unitDouble>",
                [
                    "'#Rsl'",
                    300
                ]
            ],
            "scaleStyles": [
                "<boolean>",
                true
            ],
            "'CnsP'": [
                "<boolean>",
                true
            ],
            "'Intr'": [
                "<enumerated>",
                [
                    "'Intp'",
                    "automaticInterpolation"
                ]
            ]
        },
        DialogModes.ALL
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<class>",
                "'RGBM'"
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<integer>",
                3
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Verificar"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Verificar"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Merge Visible
    jamEngine.jsonPlay(
        "'MrgV'",
        null,
        DialogModes.NO
    );
    // Convert to Smart Object
    jamEngine.jsonPlay(
        "newPlacedLayer",
        null,
        DialogModes.NO
    );
    // Rasterize
    jamEngine.jsonPlay(
        "rasterizeLayer", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Camada 0"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Canvas Size
    jamEngine.jsonPlay(
        "'CnvS'", {
            "'Rltv'": [
                "<boolean>",
                true
            ],
            "'Wdth'": [
                "<unitDouble>",
                [
                    "'#Pxl'",
                    150
                ]
            ],
            "'Hght'": [
                "<unitDouble>",
                [
                    "'#Pxl'",
                    150
                ]
            ],
            "'Hrzn'": [
                "<enumerated>",
                [
                    "'HrzL'",
                    "'Cntr'"
                ]
            ],
            "'Vrtc'": [
                "<enumerated>",
                [
                    "'VrtL'",
                    "'Cntr'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Trsp'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "contentLayer",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<object>",
                [
                    "contentLayer",
                    {
                        "'Type'": [
                            "<object>",
                            [
                                "solidColorLayer",
                                {
                                    "'Clr '": [
                                        "<object>",
                                        [
                                            "'RGBC'",
                                            {
                                                "'Rd  '": [
                                                    "<double>",
                                                    0
                                                ],
                                                "'Grn '": [
                                                    "<double>",
                                                    0
                                                ],
                                                "'Bl  '": [
                                                    "<double>",
                                                    0
                                                ]
                                            }
                                        ]
                                    ]
                                }
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 0"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelection"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ],
                    [
                        "<integer>",
                        5
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Halftone Nocaute Color Copy"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                867
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                867
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preenchimento de Cor 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Mask"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<class>",
                "'Grys'"
            ]
        },
        DialogModes.NO
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<object>",
                [
                    "'BtmM'",
                    {
                        "'Rslt'": [
                            "<unitDouble>",
                            [
                                "'#Rsl'",
                                300
                            ]
                        ],
                        "'Mthd'": [
                            "<enumerated>",
                            [
                                "'Mthd'",
                                "'HlfS'"
                            ]
                        ],
                        "'Frqn'": [
                            "<unitDouble>",
                            [
                                "'#Rsl'",
                                35
                            ]
                        ],
                        "'Angl'": [
                            "<unitDouble>",
                            [
                                "'#Ang'",
                                22
                            ]
                        ],
                        "'Shp '": [
                            "<enumerated>",
                            [
                                "'Shp '",
                                "'Rnd '"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<object>",
                [
                    "'Grys'",
                    {
                        "'Rt  '": [
                            "<integer>",
                            1
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<property>",
                            "'Bckg'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Opct'": [
                            "<unitDouble>",
                            [
                                "'#Prc'",
                                100
                            ]
                        ],
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "'Nrml'"
                            ]
                        ]
                    }
                ]
            ],
            "'LyrI'": [
                "<integer>",
                3
            ]
        },
        DialogModes.NO
    );
    // Color Range
    jamEngine.jsonPlay(
        "'ClrR'", {
            "'Fzns'": [
                "<integer>",
                200
            ],
            "'Mnm '": [
                "<object>",
                [
                    "'Grsc'",
                    {
                        "'Gry '": [
                            "<double>",
                            0
                        ]
                    }
                ]
            ],
            "'Mxm '": [
                "<object>",
                [
                    "'Grsc'",
                    {
                        "'Gry '": [
                            "<double>",
                            0
                        ]
                    }
                ]
            ],
            "colorModel": [
                "<integer>",
                0
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '",
        null,
        DialogModes.NO
    );
    // Duplicate
    jamEngine.jsonPlay(
        "'Dplc'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<name>",
                            "Halftone Nocaute Color Copy"
                        ]
                    ]
                ]
            ],
            "destinationDocumentID": [
                "<integer>",
                888
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'Idnt'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                892
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preenchimento de Cor 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Camada 1"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Design"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            2
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        2
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "contentLayer",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<object>",
                [
                    "contentLayer",
                    {
                        "'Type'": [
                            "<object>",
                            [
                                "solidColorLayer",
                                {
                                    "'Clr '": [
                                        "<object>",
                                        [
                                            "'RGBC'",
                                            {
                                                "'Rd  '": [
                                                    "<double>",
                                                    0
                                                ],
                                                "'Grn '": [
                                                    "<double>",
                                                    0
                                                ],
                                                "'Bl  '": [
                                                    "<double>",
                                                    0
                                                ]
                                            }
                                        ]
                                    ]
                                }
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Cor Escolhida"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Cor escolhida"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                468
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<enumerated>",
                                    [
                                        "'Ordn'",
                                        "'Trgt'"
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Show
    jamEngine.jsonPlay(
        "'Shw '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<enumerated>",
                                    [
                                        "'Ordn'",
                                        "'Trgt'"
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<enumerated>",
                                    [
                                        "'Ordn'",
                                        "'Trgt'"
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Layer Via Copy
    jamEngine.jsonPlay(
        "'CpTL'",
        null,
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preenchimento de Cor 1"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            0
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        5
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Preenchimento de Cor 1 copiar"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Design"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelection"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        5
                    ],
                    [
                        "<integer>",
                        2
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            3
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        5
                    ],
                    [
                        "<integer>",
                        2
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Show
    jamEngine.jsonPlay(
        "'Shw '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Preenchimento de Cor 1"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Merge Layers
    jamEngine.jsonPlay(
        "'Mrg2'", {},
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Trsp'"
                            ]
                        ]
                    ],
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 1"
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Layer Via Copy
    jamEngine.jsonPlay(
        "'CpTL'",
        null,
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Design"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        2
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        2
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 2"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        7
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Original"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Layer Via Copy
    jamEngine.jsonPlay(
        "'CpTL'",
        null,
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Original"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Show
    jamEngine.jsonPlay(
        "'Shw '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Preenchimento de Cor 1 copiar"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preenchimento de Cor 1 copiar"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        6
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            4
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        6
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "'Dfrn'"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original copiar"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelection"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        8
                    ],
                    [
                        "<integer>",
                        6
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Merge Layers
    jamEngine.jsonPlay(
        "'Mrg2'", {},
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Detectar"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Nocaute"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<class>",
                "'Grys'"
            ]
        },
        DialogModes.NO
    );
    // Levels
    jamEngine.jsonPlay(
        "'Lvls'", {
            "presetKind": [
                "<enumerated>",
                [
                    "presetKindType",
                    "presetKindCustom"
                ]
            ],
            "'Adjs'": [
                "<list>",
                [
                    [
                        "<object>",
                        [
                            "'LvlA'",
                            {
                                "'Chnl'": [
                                    "<reference>",
                                    [
                                        [
                                            "'Chnl'",
                                            [
                                                "<enumerated>",
                                                [
                                                    "'Chnl'",
                                                    "'Gry '"
                                                ]
                                            ]
                                        ]
                                    ]
                                ],
                                "'Inpt'": [
                                    "<list>",
                                    [
                                        [
                                            "<integer>",
                                            0
                                        ],
                                        [
                                            "<integer>",
                                            220
                                        ]
                                    ]
                                ]
                            }
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                888
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                888
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Duplicate
    jamEngine.jsonPlay(
        "'Dplc'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<name>",
                            "Nocaute"
                        ]
                    ]
                ]
            ],
            "destinationDocumentID": [
                "<integer>",
                935
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'Idnt'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                935
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                935
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Trsp'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Detectar"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        2
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Inverse
    jamEngine.jsonPlay(
        "'Invs'",
        null,
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '",
        null,
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<enumerated>",
                [
                    "'Ordn'",
                    "'None'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Nocaute 2"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                108
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<object>",
                [
                    "'BtmM'",
                    {
                        "'Rslt'": [
                            "<unitDouble>",
                            [
                                "'#Rsl'",
                                300
                            ]
                        ],
                        "'Mthd'": [
                            "<enumerated>",
                            [
                                "'Mthd'",
                                "'HlfS'"
                            ]
                        ],
                        "'Frqn'": [
                            "<unitDouble>",
                            [
                                "'#Rsl'",
                                38
                            ]
                        ],
                        "'Angl'": [
                            "<unitDouble>",
                            [
                                "'#Ang'",
                                15
                            ]
                        ],
                        "'Shp '": [
                            "<enumerated>",
                            [
                                "'Shp '",
                                "'Rnd '"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.ALL
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<object>",
                [
                    "'Grys'",
                    {
                        "'Rt  '": [
                            "<integer>",
                            1
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<property>",
                            "'Bckg'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Opct'": [
                            "<unitDouble>",
                            [
                                "'#Prc'",
                                100
                            ]
                        ],
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "'Nrml'"
                            ]
                        ]
                    }
                ]
            ],
            "'LyrI'": [
                "<integer>",
                4
            ]
        },
        DialogModes.NO
    );
    // Color Range
    jamEngine.jsonPlay(
        "'ClrR'", {
            "'Fzns'": [
                "<integer>",
                200
            ],
            "'Mnm '": [
                "<object>",
                [
                    "'Grsc'",
                    {
                        "'Gry '": [
                            "<double>",
                            0
                        ]
                    }
                ]
            ],
            "'Mxm '": [
                "<object>",
                [
                    "'Grsc'",
                    {
                        "'Gry '": [
                            "<double>",
                            0
                        ]
                    }
                ]
            ],
            "colorModel": [
                "<integer>",
                0
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '",
        null,
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Mask"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Duplicate
    jamEngine.jsonPlay(
        "'Dplc'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<name>",
                            "Halftone Nocaute Color Copy"
                        ]
                    ]
                ]
            ],
            "destinationDocumentID": [
                "<integer>",
                888
            ],
            "'Nm  '": [
                "<string>",
                "Mask"
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'Idnt'": [
                "<list>",
                [
                    [
                        "<integer>",
                        9
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                935
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                888
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                223
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Camada 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        7
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                6055
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Duplicate
    jamEngine.jsonPlay(
        "'Dplc'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<name>",
                            "Halftone Nocaute Color Copy"
                        ]
                    ]
                ]
            ],
            "destinationDocumentID": [
                "<integer>",
                6038
            ],
            "'Nm  '": [
                "<string>",
                "Cor escolhida"
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'Idnt'": [
                "<list>",
                [
                    [
                        "<integer>",
                        12
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                6055
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Tshirt Color"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Msk '"
                            ]
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            0
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        10
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Detectar"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        6
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        6
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Show
    jamEngine.jsonPlay(
        "'Shw '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<enumerated>",
                                    [
                                        "'Ordn'",
                                        "'Trgt'"
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Trsp'"
                            ]
                        ]
                    ],
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Mask"
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Inverse
    jamEngine.jsonPlay(
        "'Invs'",
        null,
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'Nw  '": [
                "<class>",
                "'Chnl'"
            ],
            "'At  '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Msk '"
                            ]
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<enumerated>",
                [
                    "'UsrM'",
                    "'RvlS'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Mask"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Mask"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        9
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        9
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Tshirt Color"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelection"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        10
                    ],
                    [
                        "<integer>",
                        7
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        10
                    ],
                    [
                        "<integer>",
                        7
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                122
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<object>",
                [
                    "'BtmM'",
                    {
                        "'Rslt'": [
                            "<unitDouble>",
                            [
                                "'#Rsl'",
                                300
                            ]
                        ],
                        "'Mthd'": [
                            "<enumerated>",
                            [
                                "'Mthd'",
                                "'HlfS'"
                            ]
                        ],
                        "'Frqn'": [
                            "<unitDouble>",
                            [
                                "'#Rsl'",
                                38
                            ]
                        ],
                        "'Angl'": [
                            "<unitDouble>",
                            [
                                "'#Ang'",
                                75
                            ]
                        ],
                        "'Shp '": [
                            "<enumerated>",
                            [
                                "'Shp '",
                                "'Rnd '"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.ALL
    );
    // Convert Mode
    jamEngine.jsonPlay(
        "'CnvM'", {
            "'T   '": [
                "<object>",
                [
                    "'Grys'",
                    {
                        "'Rt  '": [
                            "<integer>",
                            1
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<property>",
                            "'Bckg'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Opct'": [
                            "<unitDouble>",
                            [
                                "'#Prc'",
                                100
                            ]
                        ],
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "'Nrml'"
                            ]
                        ]
                    }
                ]
            ],
            "'LyrI'": [
                "<integer>",
                3
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<enumerated>",
                [
                    "'Ordn'",
                    "'Al  '"
                ]
            ]
        },
        DialogModes.NO
    );
    // Copy
    jamEngine.jsonPlay(
        "'copy'", {
            "copyHint": [
                "<string>",
                "pixels"
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                74
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        7
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Duplicate
    jamEngine.jsonPlay(
        "'Dplc'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Original copiar"
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'Idnt'": [
                "<list>",
                [
                    [
                        "<integer>",
                        11
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Msk '"
                            ]
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'Nw  '": [
                "<class>",
                "'Chnl'"
            ],
            "'At  '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Msk '"
                            ]
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<enumerated>",
                [
                    "'UsrM'",
                    "'RvlA'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Paste
    jamEngine.jsonPlay(
        "'past'", {
            "'AntA'": [
                "<enumerated>",
                [
                    "'Annt'",
                    "'Anno'"
                ]
            ],
            "'As  '": [
                "<class>",
                "'Pxel'"
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<enumerated>",
                [
                    "'Ordn'",
                    "'None'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                122
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                122
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Canvas Size
    jamEngine.jsonPlay(
        "'CnvS'", {
            "'Rltv'": [
                "<boolean>",
                true
            ],
            "'Wdth'": [
                "<unitDouble>",
                [
                    "'#Pxl'",
                    -150
                ]
            ],
            "'Hght'": [
                "<unitDouble>",
                [
                    "'#Pxl'",
                    -150
                ]
            ],
            "'Hrzn'": [
                "<enumerated>",
                [
                    "'HrzL'",
                    "'Cntr'"
                ]
            ],
            "'Vrtc'": [
                "<enumerated>",
                [
                    "'VrtL'",
                    "'Cntr'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelection"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        7
                    ],
                    [
                        "<integer>",
                        11
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Tshirt Color"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelection"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        10
                    ],
                    [
                        "<integer>",
                        7
                    ],
                    [
                        "<integer>",
                        11
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Halftone Nocaute Color"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                1082
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                1082
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Clr '": [
                            "<enumerated>",
                            [
                                "'Clr '",
                                "'Grn '"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Msk '"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'BckL'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<property>",
                            "'Bckg'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Design"
                        ],
                        "'Opct'": [
                            "<unitDouble>",
                            [
                                "'#Prc'",
                                100
                            ]
                        ],
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "'Nrml'"
                            ]
                        ]
                    }
                ]
            ],
            "'LyrI'": [
                "<integer>",
                10
            ]
        },
        DialogModes.NO
    );
    // Layer Via Copy
    jamEngine.jsonPlay(
        "'CpTL'",
        null,
        DialogModes.NO
    );
    // Hide
    jamEngine.jsonPlay(
        "'Hd  '", {
            "'null'": [
                "<list>",
                [
                    [
                        "<reference>",
                        [
                            [
                                "'Lyr '",
                                [
                                    "<name>",
                                    "Design"
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Detectar preto"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "layerSection",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'From'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<object>",
                [
                    "layerSection",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Remover preto"
                        ]
                    }
                ]
            ],
            "layerSectionStart": [
                "<integer>",
                12
            ],
            "layerSectionEnd": [
                "<integer>",
                13
            ],
            "'Nm  '": [
                "<string>",
                "Remover preto"
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Detectar preto"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        11
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "contentLayer",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<object>",
                [
                    "contentLayer",
                    {
                        "'Type'": [
                            "<object>",
                            [
                                "solidColorLayer",
                                {
                                    "'Clr '": [
                                        "<object>",
                                        [
                                            "'RGBC'",
                                            {
                                                "'Rd  '": [
                                                    "<double>",
                                                    0
                                                ],
                                                "'Grn '": [
                                                    "<double>",
                                                    0
                                                ],
                                                "'Bl  '": [
                                                    "<double>",
                                                    0
                                                ]
                                            }
                                        ]
                                    ]
                                }
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            2
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        14
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'AdjL'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<object>",
                [
                    "'AdjL'",
                    {
                        "'Type'": [
                            "<object>",
                            [
                                "'BanW'",
                                {
                                    "presetKind": [
                                        "<enumerated>",
                                        [
                                            "presetKindType",
                                            "presetKindDefault"
                                        ]
                                    ],
                                    "'Rd  '": [
                                        "<integer>",
                                        40
                                    ],
                                    "'Yllw'": [
                                        "<integer>",
                                        60
                                    ],
                                    "'Grn '": [
                                        "<integer>",
                                        40
                                    ],
                                    "'Cyn '": [
                                        "<integer>",
                                        60
                                    ],
                                    "'Bl  '": [
                                        "<integer>",
                                        20
                                    ],
                                    "'Mgnt'": [
                                        "<integer>",
                                        80
                                    ],
                                    "useTint": [
                                        "<boolean>",
                                        false
                                    ],
                                    "tintColor": [
                                        "<object>",
                                        [
                                            "'RGBC'",
                                            {
                                                "'Rd  '": [
                                                    "<double>",
                                                    225.000457763672
                                                ],
                                                "'Grn '": [
                                                    "<double>",
                                                    211.000671386719
                                                ],
                                                "'Bl  '": [
                                                    "<double>",
                                                    179.001159667969
                                                ]
                                            }
                                        ]
                                    ]
                                }
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'AdjL'",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'BanW'",
                    {
                        "'Rd  '": [
                            "<integer>",
                            100
                        ],
                        "'Yllw'": [
                            "<integer>",
                            100
                        ],
                        "'Grn '": [
                            "<integer>",
                            100
                        ],
                        "'Cyn '": [
                            "<integer>",
                            100
                        ],
                        "'Bl  '": [
                            "<integer>",
                            100
                        ],
                        "'Mgnt'": [
                            "<integer>",
                            100
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            5
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        15
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<property>",
                            "'fsel'"
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'RGB '"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Remover preto"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        12
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'Nw  '": [
                "<class>",
                "'Chnl'"
            ],
            "'At  '": [
                "<reference>",
                [
                    [
                        "'Chnl'",
                        [
                            "<enumerated>",
                            [
                                "'Chnl'",
                                "'Msk '"
                            ]
                        ]
                    ]
                ]
            ],
            "'Usng'": [
                "<enumerated>",
                [
                    "'UsrM'",
                    "'RvlS'"
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preto-e-Branco 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        15
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "blendDivide"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preenchimento de Cor 1"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        14
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Detectar preto"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        14
                    ],
                    [
                        "<integer>",
                        11
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Preto-e-Branco 1"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        14
                    ],
                    [
                        "<integer>",
                        11
                    ],
                    [
                        "<integer>",
                        15
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Remover preto"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        14
                    ],
                    [
                        "<integer>",
                        11
                    ],
                    [
                        "<integer>",
                        15
                    ],
                    [
                        "<integer>",
                        12
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "layerSection",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'From'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "layerSectionStart": [
                "<integer>",
                16
            ],
            "layerSectionEnd": [
                "<integer>",
                17
            ],
            "'Nm  '": [
                "<string>",
                "Grupo 1"
            ]
        },
        DialogModes.NO
    );
    // Merge Layers
    jamEngine.jsonPlay(
        "'Mrg2'",
        null,
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Design Preto removido"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Design"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Delete
    jamEngine.jsonPlay(
        "'Dlt '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Overlay Ctrl + J (option)"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Duplicate
    jamEngine.jsonPlay(
        "'Dplc'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<name>",
                            "Halftone Nocaute Color"
                        ]
                    ]
                ]
            ],
            "destinationDocumentID": [
                "<integer>",
                160
            ],
            "'Nm  '": [
                "<string>",
                "Overlay Ctrl + J (option)"
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'Idnt'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                165
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Move
    jamEngine.jsonPlay(
        "'move'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<index>",
                            4
                        ]
                    ]
                ]
            ],
            "'Adjs'": [
                "<boolean>",
                false
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        5
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original copiar"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ],
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Merge Layers
    jamEngine.jsonPlay(
        "'Mrg2'", {},
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Overlay Ctrl + J (option)"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        5
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original copiar"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Original"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Overlay Ctrl + J (option)"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        5
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Create Clipping Mask
    jamEngine.jsonPlay(
        "'GrpL'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Md  '": [
                            "<enumerated>",
                            [
                                "'BlnM'",
                                "'SftL'"
                            ]
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Original"
                        ]
                    ]
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Overlay Ctrl + J (option)"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        3
                    ],
                    [
                        "<integer>",
                        4
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Merge Layers
    jamEngine.jsonPlay(
        "'Mrg2'", {},
        DialogModes.NO
    );
    // Set
    jamEngine.jsonPlay(
        "'setd'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'T   '": [
                "<object>",
                [
                    "'Lyr '",
                    {
                        "'Nm  '": [
                            "<string>",
                            "Design"
                        ]
                    }
                ]
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<name>",
                            "Tshirt Color"
                        ]
                    ]
                ]
            ],
            "selectionModifier": [
                "<enumerated>",
                [
                    "selectionModifierType",
                    "addToSelectionContinuous"
                ]
            ],
            "'MkVs'": [
                "<boolean>",
                false
            ],
            "'LyrI'": [
                "<list>",
                [
                    [
                        "<integer>",
                        2
                    ],
                    [
                        "<integer>",
                        5
                    ]
                ]
            ]
        },
        DialogModes.NO
    );
    // Make
    jamEngine.jsonPlay(
        "'Mk  '", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<class>",
                            null
                        ]
                    ]
                ]
            ],
            "'Nm  '": [
                "<string>",
                "Halftone Roseta 30 LPI"
            ],
            "'Usng'": [
                "<reference>",
                [
                    [
                        "'Lyr '",
                        [
                            "<enumerated>",
                            [
                                "'Ordn'",
                                "'Trgt'"
                            ]
                        ]
                    ]
                ]
            ],
            "'Vrsn'": [
                "<integer>",
                5
            ]
        },
        DialogModes.NO
    );
    // Select
    jamEngine.jsonPlay(
        "'slct'", {
            "'null'": [
                "<reference>",
                [
                    [
                        "'Dcmn'",
                        [
                            "<offset>",
                            -1
                        ]
                    ]
                ]
            ],
            "'DocI'": [
                "<integer>",
                2580
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Close
    jamEngine.jsonPlay(
        "'Cls '", {
            "'Svng'": [
                "<enumerated>",
                [
                    "'YsN '",
                    "'N   '"
                ]
            ],
            "'DocI'": [
                "<integer>",
                2580
            ],
            "forceNotify": [
                "<boolean>",
                true
            ]
        },
        DialogModes.NO
    );
    // Stop
    jamEngine.jsonPlay(
        "'Stop'", {
            "'Msge'": [
                "<string>",
                "Script Concluído!\r\rHalftone Roseta v3.0 ©2025 TEC-DTF - RIO DE JANEIRO - Todos o direitos reservados Lei 9.610 (BR).\r"
            ]
        },
        DialogModes.ALL
    );
} catch (e) {
    if (e.number !== 8007) // Not a user cancel error
    {
        try {
            jamEngine.jsonPlay(
                "'Stop'", {
                    "'Msge'": [
                        "<string>",
                        e.message.replace(/^.*\n- /, "")
                    ]
                },
                DialogModes.ALL
            );
        } catch (e) {}
    }
}

