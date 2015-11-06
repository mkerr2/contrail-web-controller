/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var fixedIPModel = ContrailModel.extend({

        defaultConfig: {
            'fixedIp': null,
            'subnet_uuid':'',
            'subnetDataSource' : [],
            'uuid':'',
            'disableFIP':false,
            'visibleSubnet':true
        },

        validateAttr: function (attributePath, validation, data) {
            var model = data.model().attributes.model(),
                attr = cowu.getAttributeFromPath(attributePath),
                errors = model.get(cowc.KEY_MODEL_ERRORS),
                attrErrorObj = {}, isValid;

            isValid = model.isValid(attributePath, validation);

            attrErrorObj[attr + cowc.ERROR_SUFFIX_ID] =
                        (isValid == true) ? false : isValid;
            errors.set(attrErrorObj);
        },


        validations: {
            fixedIPValidations: {
                'fixedIp': function(value, attr, finalObj) {
                    if(value != null) {
                        if(value.trim() != "" && !isValidIP(value)) {
                            return "Enter a valid IP In the format xxx.xxx.xxx.xxx";
                        }
                        var fixedIP = value.trim();
                        if(fixedIP.split("/").length > 1) {
                            return "Enter a valid IP In the format xxx.xxx.xxx.xxx";
                        }
                        if(finalObj.subnet_uuid != "") {
                            if(!isIPBoundToRange(fixedIP, finalObj.subnet_uuid)){
                                return "Enter a fixed IP within the selected subnet range";
                            }
                            if(isStartAddress(fixedIP, finalObj.subnet_uuid) == true || 
                               isEndAddress(fixedIP, finalObj.subnet_uuid) == true) {
                                return "Fixed IP cannot be same as broadcast/start address";
                            }
                        }
                    }
                }
            }
        }
    });
    return fixedIPModel;
});
