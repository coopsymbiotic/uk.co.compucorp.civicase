<?php

use CRM_Civicase_Service_BaseCaseTypePostProcessor as BaseCaseTypePostProcessor;
use CRM_Civicase_Helper_InstanceCustomGroupPostProcess as InstanceCustomGroupPostProcess;

/**
 * Handles the custom field related post processing for a case type.
 *
 * This class is specific for the Case management instance and handles the
 * post processing as related to custom field set associated with a case type
 * when the case type is created/updated.
 */
class CRM_Civicase_Service_CaseManagementCaseTypePostProcessor extends BaseCaseTypePostProcessor {

  /**
   * Handles case type post processing on create.
   *
   * @param int $caseTypeId
   *   Case Type ID.
   * @param \CRM_Civicase_Helper_InstanceCustomGroupPostProcess $postProcessHelper
   *   Post process helper class.
   */
  public function processCaseTypeCustomGroupsOnCreate($caseTypeId, InstanceCustomGroupPostProcess $postProcessHelper) {
    $customGroups = $postProcessHelper->getCaseTypeCustomGroups($caseTypeId);
    if (empty($customGroups)) {
      return;
    }
    foreach ($customGroups as $cusGroup) {
      $extendColValue = !empty($cusGroup['extends_entity_column_value']) ? $cusGroup['extends_entity_column_value'] : [];
      $entityColumnValues = array_merge($extendColValue, [$caseTypeId]);
      $this->updateCustomGroup($cusGroup['id'], $entityColumnValues);
    }
  }

  /**
   * Handles case type post processing on update.
   *
   * @param int $caseTypeId
   *   Case type Id.
   * @param \CRM_Civicase_Helper_InstanceCustomGroupPostProcess $postProcessHelper
   *   Post process helper class.
   */
  public function processCaseTypeCustomGroupsOnUpdate($caseTypeId, InstanceCustomGroupPostProcess $postProcessHelper) {
    $mismatchCustomGroups = $postProcessHelper->getCaseTypeCustomGroupsWithCategoryMismatch($caseTypeId);
    if (empty($mismatchCustomGroups)) {
      return;
    }
    foreach ($mismatchCustomGroups as $cusGroup) {
      $entityColumnValues = array_diff($cusGroup['extends_entity_column_value'], [$caseTypeId]);
      $entityColumnValues = $entityColumnValues ? $entityColumnValues : NULL;
      $this->updateCustomGroup($cusGroup['id'], $entityColumnValues);
    }

    $this->processCaseTypeCustomGroupsOnCreate($caseTypeId, $postProcessHelper);
  }

  /**
   * Updates a custom group.
   *
   * We are using the custom group object here rather than the API because if
   * this is updated via the API the `extends_entity_column_id` field will be
   * set to NULL and this is needed to keep track of custom groups extending
   * case categories.
   *
   * @param int $id
   *   Custom group Id.
   * @param array|null $entityColumnValues
   *   Entity custom values for custom group.
   */
  private function updateCustomGroup($id, $entityColumnValues) {
    $cusGroup = new CRM_Core_BAO_CustomGroup();
    $cusGroup->id = $id;
    $entityColValue = is_null($entityColumnValues) ? 'null' : CRM_Core_DAO::VALUE_SEPARATOR . implode(CRM_Core_DAO::VALUE_SEPARATOR, $entityColumnValues) . CRM_Core_DAO::VALUE_SEPARATOR;
    $cusGroup->extends_entity_column_value = $entityColValue;
    $cusGroup->save();
  }

}
