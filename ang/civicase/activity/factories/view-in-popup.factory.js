(function (angular, $, _, CRM) {
  var module = angular.module('civicase');

  module.factory('viewInPopup', function (ActivityForms) {
    /**
     * View activity in a popup
     *
     * @param {object} $event event
     * @param {*} activity activity to be viewed
     * @returns {object} jQuery object
     */
    function viewInPopup ($event, activity) {
      var isClickingAButton = $event && $($event.target).is('a, a *, input, button, button *');
      var isEmailTypeActivity = activity.type.toLowerCase() === 'email';
      var activityForm = ActivityForms.getActivityFormService(activity, {
        action: isEmailTypeActivity ? 'view' : 'update'
      });

      if (!activityForm || isClickingAButton) {
        return;
      }

      return CRM.loadForm(activityForm.getActivityFormUrl(activity));
    }

    return viewInPopup;
  });
})(angular, CRM.$, CRM._, CRM);
