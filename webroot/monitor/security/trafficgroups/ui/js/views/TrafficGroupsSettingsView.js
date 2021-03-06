/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'lodash',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var TrafficGroupsSettingsView = ContrailView.extend({
        el: $(contentContainer),
        editFilterOptions: function (tagTypeList, callback) {
            var filterView = this,
                filterModel = this.model,
                prefixId = ctwl.TRAFFIC_GROUPS_TIMERANGCE,
                editTemplate = contrail.getTemplate4Id(cowc.TMPL_EDIT_FORM),
                editLayout = editTemplate({prefixId: prefixId}),
                modalId = 'configure-' + prefixId ,
                modalConfig = {
                   'modalId': modalId,
                   'className': 'modal-700',
                   'title': ctwl.TITLE_TRAFFIC_GROUPS_SETTINGS,
                   'body': editLayout,
                   'onSave': function () {
                        filterModel.tgSettingsRule({
                            init: function () {
                                cowu.enableModalLoading(modalId);
                            },
                            success: function (modelObj) {
                                callback(modelObj);
                                $("#" + modalId).modal('hide');
                            },
                            error: function (error) {
                                cowu.disableModalLoading(modalId, function () {
                                });
                            }
                        });
                    },
                   'onCancel': function() {
                        Knockback.release(filterModel, document.getElementById(modalId));
                        kbValidation.unbind(filterView);
                        $("#" + modalId).modal('hide');
                    }
                };
            cowu.createModal(modalConfig);
            $('#'+ modalId).on('shown.bs.modal', function () {
                 filterView.renderView4Config($("#" + modalId).find("#" + prefixId + "-form"),
                    filterModel, filterView.tagsFilterViewConfig(tagTypeList),'tgSettingsRuleValidation', null, null,
                    function () {
                        Knockback.applyBindings(filterModel, document.getElementById(modalId));
                        kbValidation.bind(filterView, {collection:filterModel.model().attributes.endpoints});
                    }, null, null);
            });
        },
        editTgSettings: function (options) {
            options.prefixId = ctwl.TRAFFIC_GROUPS_SETTINGS,
            options.targetEle = '#tg_settings_sec_edit';
            options.getViewConfig = this.tgSettingsViewConfig;
            options.type = 'settings';
            this.renderTgSettings(options);
        },
        editTgFilters: function (options) {
            options.prefixId = ctwl.TRAFFIC_GROUPS_FILTERS,
            options.targetEle = '#tg_filter_sec';
            options.getViewConfig = this.tgFilterViewConfig;
            this.renderTgSettings(options);
        },
        renderTgSettings: function(options) {
            var filterView = this,
                filterModel = this.model,
                formTemplate = contrail.getTemplate4Id(ctwc.TMPL_FORM_RESULT),
                tgFiltersFormId = "#" + options.prefixId + "-form";
            filterModel.callback = options.callback;
            $(options.targetEle).html(formTemplate({
                prefix: options.prefixId
            }));
            filterView.subscribeGroupByChangeEvent(filterModel, ctwl.EDIT_ACTION);
            filterView.renderView4Config($(this.$el).find(tgFiltersFormId),
            filterModel, options.getViewConfig(options.tagTypeList, filterView),'tgSettingsRuleValidation', null, null,
                function () {
                    Knockback.applyBindings(filterModel, document.getElementById(options.prefixId + '-container'));
                    kbValidation.bind(filterView, {collection:filterModel.model().attributes.endpoints});
                    if(options.type == 'settings') {
                        options.tgView.updateTgSettingsView('edit');
                        //$('#viewTgSettings').on('click',
                          //  options.tgView.updateTgSettingsView.bind(options.tgView));
                    }
                    filterView.subscribeModelChangeEvents(filterModel, ctwl.EDIT_ACTION, options.tgView);
                }, null, null);
        },
        getTagValuesObj: function(tagTypeList) {
            var tagsObj = [],
                tagsMap = cowc.TRAFFIC_GROUP_TAG_TYPES;
            _.each(tagsMap, function(tagObj) {
                var tagValues = tagTypeList[tagObj.value],
                    tagData = [];
                _.each(tagValues, function(tagValue) {
                    tagData.push({
                        text: tagValue,
                        value: tagValue + cowc.DROPDOWN_VALUE_SEPARATOR + tagObj.value,
                        id: tagValue + cowc.DROPDOWN_VALUE_SEPARATOR + tagObj.value,
                        parent: tagObj.value
                     });
                });
                tagsObj.push({text : tagObj.text, value : tagObj.value, children : tagData});
            });
            return tagsObj;
        },
        tagsFilterViewConfig: function(tagTypeList) {
            var addrFields = [],
                tagsMap = cowc.TRAFFIC_GROUP_TAG_TYPES,
                tagValues = this.getTagValuesObj(tagTypeList);
            return {
                elementId: 'Traffic_Groups_Timerange',
                view: 'SectionView',
                viewConfig: {
                    rows: [
                        {
                            columns: [
                                {
                                    elementId: 'stats_time',
                                    view: "AccordianView",
                                    viewConfig: [
                                        {
                                            elementId: 'Traffic_Groups_Time_Range',
                                            title: 'Time Range',
                                            view: "SectionView",
                                            viewConfig: {
                                                rows: [
                                                    ctwvc.getTimeRangeConfig("hh:mm A", true)
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        tgFilterViewConfig: function(tagTypeList, scope) {
            var addrFields = [],
                tagsMap = cowc.TRAFFIC_GROUP_TAG_TYPES,
                tagValues = scope.getTagValuesObj(tagTypeList);
            return {
                elementId: 'Traffic_Groups_Filters',
                view: 'SectionView',
                viewConfig: {
                    rows: [{
                        columns: [{
                            elementId: "filter_by_endpoints",
                            view: "FormEditableGridView",
                            viewConfig: {
                                path: "endpoints",
                                collection: "endpoints",
                                class:'col-xs-12',
                                validation:
                                    "filterRuleValidation",
                                templateId: cowc.TMP_EDITABLE_GRID_ACTION_VIEW,
                                columns: [{
                                    elementId: "endpoint",
                                    name: "Filter By Endpoints",
                                    view: "FormHierarchicalDropdownView",
                                    viewConfig: {
                                        templateId: cowc.TMPL_EDITABLE_GRID_MULTISELECT_VIEW,
                                        class:'col-xs-12',
                                        path: 'endpoint',
                                        width: 535,
                                        dataBindValue: 'endpoint()',
                                        elementConfig: {
                                            placeholder: 'Select Endpoint',
                                            minimumResultsForSearch : 1,
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            data: tagValues,
                                            width: 530,
                                            queryMap: [
                                                { name : 'Application',  value : 'app', iconClass:'fa fa-list-alt' },
                                                { name : 'Deployment',  value : 'deployment', iconClass:'fa fa-database' },
                                                { name : 'Site',  value : 'site', iconClass:'fa fa-life-ring' },
                                                { name : 'Tier',  value : 'tier', iconClass:'fa fa-clone' }]
                                        }
                                    }
                                }],
                                rowActions: [{
                                        onClick: "function() {\
                                        $root.addEndpointByIndex($data, this); }",
                                        iconClass: 'fa fa-plus'
                                    },
                                    {
                                        onClick: "function() {\
                                        $root.deleteEndpoint($data, this)\
                                        ;}",
                                        iconClass: 'fa fa-minus'
                                }],
                                gridActions: [{
                                        onClick: "function() {\
                                        addEndpoint(); }",
                                        buttonTitle: ""
                                }]
                            }
                        }]
                    }]
                }
            }
        },
        tgSettingsViewConfig: function(tagTypeList, scope) {
            var addrFields = [],
                tagsMap = cowc.TRAFFIC_GROUP_TAG_TYPES,
                tagValues = scope.getTagValuesObj(tagTypeList);
            return {
                elementId: 'Traffic_Groups_Settings',
                view: 'SectionView',
                viewConfig: {
                    rows: [
                        {
                            columns: [
                                {
                                    elementId: 'group_by_tag_type',
                                    view: 'FormMultiselectView',
                                    viewConfig: {
                                        label: "Category",
                                        templateId: cowc.TMPL_MULTISELECT_LEFT_LABEL_VIEW,
                                        path: 'group_by_tag_type',
                                        dataBindValue: 'group_by_tag_type',
                                        class: 'col-xs-4',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder: "Select Tags",
                                            data: tagsMap
                                        }
                                    }
                                },
                                {
                                    elementId: 'sub_group_by_tag_type',
                                    view: 'FormMultiselectView',
                                    viewConfig: {
                                        label: "Subcategory",
                                        templateId: cowc.TMPL_MULTISELECT_LEFT_LABEL_VIEW,
                                        path: 'sub_group_by_tag_type',
                                        dataBindValue: 'sub_group_by_tag_type',
                                        dataBindOptionList : "tag_type_list",
                                        class: 'col-xs-3',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder: "Select Tags"
                                        }
                                    }
                                },
                                {
                                  elementId: 'viewTgSettings',
                                  view: "FormButtonView",
                                  viewConfig: {
                                       label: "Apply",
                                       elementConfig: {
                                        btnClass: 'btn-primary pull-left margin-5 apply'
                                       }
                                  }
                               },
                               {
                                  elementId: 'cancelTgSettings',
                                  view: "FormButtonView",
                                  viewConfig: {
                                       label: "Cancel",
                                       elementConfig: {
                                        btnClass: 'btn-secondary pull-left margin-5 cancel'
                                       }
                                  }
                               }
                            ]
                        }
                    ]
                }
            }
        },
        subscribeGroupByChangeEvent: function(tgModel) {
            tgModel.__kb.view_model.model().on('change:group_by_tag_type',
                function(model, newValue){
                    tgModel.onGroupByTagTypeChanged(newValue);
                }
            );
        },
        subscribeModelChangeEvents: function(tgModel, action, view) {
            tgModel.__kb.view_model.model().on('change:group_by_tag_type',
                function(model, newValue){
                    tgModel.onGroupByTagTypeChanged(newValue);
                }
            );
            var thisModel = tgModel;
            $('#viewTgSettings .apply').on('click', function(e) {
                thisModel.tgSettingsRule({
                    success: function (modelObj) {
                        thisModel.callback(modelObj);
                        view.updateTgSettingsView(e);
                    },
                    error: function (error) {}
                });
            });
            $('#cancelTgSettings .cancel').on('click', function(e) {
                view.updateTgSettingsView('viewMode');
            });
        }
    });
    return TrafficGroupsSettingsView;
});
