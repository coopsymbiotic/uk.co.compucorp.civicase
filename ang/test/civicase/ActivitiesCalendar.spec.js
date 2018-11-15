/* eslint-env jasmine */

(function ($, _, moment) {
  describe('civicaseActivitiesCalendarController', function () {
    var $controller, $q, $scope, $rootScope, crmApi, formatActivity, dates, mockedActivities;

    beforeEach(module('civicase', 'crmUtil', 'civicase.data', 'ui.bootstrap'));

    beforeEach(inject(function (_$controller_, _$q_, _$rootScope_, _crmApi_,
      _formatActivity_, datesMockData) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      crmApi = _crmApi_;
      formatActivity = _formatActivity_;

      $scope = $rootScope.$new();
      dates = datesMockData;

      crmApi.and.returnValue($q.resolve({ values: [] }));
    }));

    describe('when uib-datepicker signals that it is ready', function () {
      var endOfMonth, startOfMonth;
      beforeEach(function () {
        startOfMonth = moment(dates.today).startOf('month').format('YYYY-MM-DD');
        endOfMonth = moment(dates.today).endOf('month').format('YYYY-MM-DD');

        spyOn($scope, '$emit').and.callThrough();

        initController();
        $rootScope.$emit('civicase::uibDaypicker::compiled', dates.today);
      });

      it('loads the days with incomplete activities of the currently selected month', function () {
        expect(crmApi).toHaveBeenCalledWith('Activity', 'getdayswithactivities', jasmine.objectContaining({
          status_id: { 'IN': CRM.civicase.activityStatusTypes.incomplete },
          activity_date_time: {
            'BETWEEN': [startOfMonth + ' 00:00:00', endOfMonth + ' 23:59:59']
          }
        }));
      });

      it('does not load the days with complete activities right away', function () {
        expect(crmApi.calls.count()).toBe(1);
      });

      describe('when loading is complete', function () {
        beforeEach(function () {
          crmApi.calls.reset();
          $scope.$digest();
        });

        it('loads the days with complete activities of the currently selected month', function () {
          expect(crmApi).toHaveBeenCalledWith('Activity', 'getdayswithactivities', jasmine.objectContaining({
            status_id: CRM.civicase.activityStatusTypes.completed[0],
            activity_date_time: {
              'BETWEEN': [startOfMonth + ' 00:00:00', endOfMonth + ' 23:59:59']
            }
          }));
        });

        it('has triggered the datepicker refresh twice, one for each request', function () {
          _.times(2, function (i) {
            expect($scope.$emit.calls.argsFor(i)[0]).toBe('civicase::ActivitiesCalendar::refreshDatepicker');
          });
        });
      });
    });

    describe('case id', function () {
      describe('when none is passed', function () {
        beforeEach(function () {
          commonControllerSetup(null);
        });

        it('loads the days with activities from all cases', function () {
          var apiParams1 = crmApi.calls.argsFor(0)[2];
          var apiParams2 = crmApi.calls.argsFor(1)[2];

          expect(apiParams1.case_id).toBeUndefined();
          expect(apiParams2.case_id).toBeUndefined();
        });

        describe('when selecting a date with activities', function () {
          beforeEach(function () {
            commonDateSelectSetup();
          });

          it('loads activities from all cases when selecting a day', function () {
            var apiParams = crmApi.calls.argsFor(0)[2];

            expect(apiParams.case_id).toBeUndefined();
          });

          describe('case info footer on activity card', function () {
            it('keeps the `case` property on the activities to display the footer', function () {
              expect($scope.selectedActivites.every(function (activity) {
                return typeof activity.case !== 'undefined';
              })).toBe(true);
            });
          });
        });
      });

      describe('when one is passed', function () {
        beforeEach(function () {
          commonControllerSetup();
        });

        it('loads the days with activities from that single cases', function () {
          var apiParams1 = crmApi.calls.argsFor(0)[2];
          var apiParams2 = crmApi.calls.argsFor(1)[2];

          expect(apiParams1.case_id).toEqual($scope.caseId);
          expect(apiParams2.case_id).toEqual($scope.caseId);
        });

        describe('when selecting a date with activities', function () {
          beforeEach(function () {
            commonDateSelectSetup();
          });

          it('loads activities from that single cases when selecting a day', function () {
            var apiParams = crmApi.calls.argsFor(0)[2];

            expect(apiParams.case_id).toEqual($scope.caseId);
          });

          describe('case info footer on activity card', function () {
            it('removes the `case` property on the activities to hide the footer', function () {
              expect($scope.selectedActivites.every(function (activity) {
                return typeof activity.case === 'undefined';
              })).toBe(true);
            });
          });
        });
      });

      describe('when multiple ids are passed', function () {
        beforeEach(function () {
          commonControllerSetup([_.uniqueId(), _.uniqueId(), _.uniqueId()]);
        });

        it('loads the days with activities from all the given cases', function () {
          var apiParams1 = crmApi.calls.argsFor(0)[2];
          var apiParams2 = crmApi.calls.argsFor(1)[2];

          expect(apiParams1.case_id).toEqual({ 'IN': [
            $scope.caseId[0], $scope.caseId[1], $scope.caseId[2]
          ]});
          expect(apiParams2.case_id).toEqual({ 'IN': [
            $scope.caseId[0], $scope.caseId[1], $scope.caseId[2]
          ]});
        });

        describe('when selecting a date with activities', function () {
          beforeEach(function () {
            commonDateSelectSetup();
          });

          it('loads activities from all the given cases when selecting a day', function () {
            var apiParams = crmApi.calls.argsFor(0)[2];

            expect(apiParams.case_id).toEqual({ 'IN': [
              $scope.caseId[0], $scope.caseId[1], $scope.caseId[2]
            ]});
          });

          describe('case info footer on activity card', function () {
            it('keeps the `case` property on the activities to display the footer', function () {
              expect($scope.selectedActivites.every(function (activity) {
                return typeof activity.case !== 'undefined';
              })).toBe(true);
            });
          });
        });
      });

      describe('when the case id value changes afterwards', function () {
        var oldCaseId, newCaseId;

        beforeEach(function () {
          oldCaseId = 20;
          newCaseId = 30;

          commonControllerSetup(oldCaseId);
          crmApi.calls.reset();

          $scope.caseId = newCaseId;
          $scope.$digest();
        });

        it('triggers a full reload', function () {
          expect(crmApi.calls.count()).toBe(2);

          _.times(2, function (i) {
            expect(crmApi.calls.argsFor(i)).toEqual([
              'Activity', 'getdayswithactivities', jasmine.objectContaining({
                case_id: newCaseId
              })
            ]);
          });
        });
      });
      /**
       * Common controller setup logic for the "case id" tests
       *
       * @param {*} caseIds The case ids to set on the $scope.caseId property
       */
      function commonControllerSetup (caseIds) {
        var caseIdsParam = typeof caseIds !== 'undefined' ? { caseId: caseIds } : null;

        initController(caseIdsParam);
        returnDateForStatus(dates.today, 'any');

        $rootScope.$emit('civicase::uibDaypicker::compiled');
        $scope.$digest();
      }

      /**
       * Common "onDateSelected" setup logic for the "case id" tests
       */
      function commonDateSelectSetup () {
        generateMockActivities();
        crmApi.calls.reset();
        crmApi.and.returnValue($q.resolve({
          values: mockedActivities
        }));

        $scope.selectedDate = dates.today;

        $scope.onDateSelected();
        $scope.$digest();
      }
    });

    describe('calendar options', function () {
      beforeEach(function () {
        initController();
      });

      it('hides the weeks panel from the calendar', function () {
        expect($scope.calendarOptions).toEqual(jasmine.objectContaining({
          showWeeks: false
        }));
      });

      it('provides a method to style each calendar day', function () {
        expect(typeof $scope.calendarOptions.customClass).toBe('function');
      });

      it('formats the calendar days using a single digit', function () {
        expect($scope.calendarOptions.formatDay).toBe('d');
      });

      it('starts the week day on Mondays', function () {
        expect($scope.calendarOptions.startingDay).toBe(1);
      });
    });

    describe('calendar days status', function () {
      var customClass;
      var classNameBase = 'civicase__activities-calendar__day-status civicase__activities-calendar__day-status--';

      describe('when the given calendar mode is for months', function () {
        beforeEach(function () {
          initController();

          customClass = getDayCustomClass(dates.today, 'month');
        });

        it('displays the months as normal without any custom class', function () {
          expect(customClass).toBeUndefined();
        });
      });

      describe('when the given calendar mode is for years', function () {
        beforeEach(function () {
          initController();

          customClass = getDayCustomClass(dates.today, 'year');
        });

        it('displays the years as normal without any custom class', function () {
          expect(customClass).toBeUndefined();
        });
      });

      describe('when there are no activities for the given date', function () {
        beforeEach(function () {
          initController();

          customClass = getDayCustomClass(dates.today);
        });

        it('displays the day as normal without any status', function () {
          expect(customClass).toBeUndefined();
        });
      });

      describe('when the date is outside this month', function () {
        beforeEach(function () {
          initController();

          customClass = getDayCustomClass(moment(dates.today).add(1, 'month').toDate());
        });

        it('hides the day from the calendar', function () {
          expect(customClass).toBe('invisible');
        });
      });

      describe('when the given date has all completed activities', function () {
        beforeEach(function () {
          returnDateForStatus(dates.today, 'completed');
          initControllerAndEmitDatepickerReadyEvent();

          customClass = getDayCustomClass(dates.today);
        });

        it('marks the day as having completed all of its activities', function () {
          expect(customClass).toBe(classNameBase + 'completed');
        });
      });

      describe('when the given date has incompleted activities', function () {
        describe('when the date is not in the past yet', function () {
          beforeEach(function () {
            returnDateForStatus(dates.tomorrow, 'incomplete');
            initControllerAndEmitDatepickerReadyEvent();

            customClass = getDayCustomClass(dates.tomorrow);
          });

          it('marks the day as having scheduled activities', function () {
            expect(customClass).toBe(classNameBase + 'scheduled');
          });
        });

        describe('when the date is already in the past', function () {
          beforeEach(function () {
            returnDateForStatus(dates.yesterday, 'incomplete');
            initControllerAndEmitDatepickerReadyEvent();

            customClass = getDayCustomClass(dates.yesterday);
          });

          it('marks the day as having scheduled activities', function () {
            expect(customClass).toBe(classNameBase + 'overdue');
          });
        });

        describe('when the given date has both completed and incompleted activities', function () {
          beforeEach(function () {
            returnDateForStatus(dates.today, 'any');
            initControllerAndEmitDatepickerReadyEvent();

            customClass = getDayCustomClass(dates.today);
          });

          it('does not mark the day as having completed all of its activities', function () {
            expect(customClass).toBe(classNameBase + 'overdue');
          });
        });
      });

      /**
       * Simulates a call from the date picker to the `customClass` method.
       * Even if the method is passed from a particular instance, the method
       * gets bound to the date picker, which allows access to some of its internal
       * properties and methods.
       *
       * @param {String|Date} date the current date to use to determine the class.
       * @param {String} mode the current view mode for the calendar. Can be
       *  day, month, or year. Defaults to day.
       * @return {String} the class name.
       */
      function getDayCustomClass (date, mode) {
        var uibDatepicker = {
          datepicker: {
            activeDate: new Date(dates.today)
          }
        };
        date = moment(date).toDate();
        mode = mode || 'day';

        return $scope.calendarOptions.customClass.call(uibDatepicker, { date: date, mode: mode });
      }
    });

    describe('selected activities', function () {
      beforeEach(function () {
        spyOn($scope, '$emit').and.callThrough();
      });

      describe('when selecting a date with no activities included', function () {
        beforeEach(function () {
          initializeForDateSelect();
          $scope.onDateSelected();
        });

        it('does not provide any activities for the selected date', function () {
          expect($scope.selectedActivites).toEqual([]);
        });

        it('does not open the activities popover', function () {
          expect($scope.$emit).not.toHaveBeenCalledWith('civicase::ActivitiesCalendar::openActivitiesPopover');
        });
      });

      describe('when selecting a date with activities', function () {
        beforeEach(function () {
          initializeForDateSelect(true);
          $scope.onDateSelected();
        });

        it('turns on the loading state', function () {
          expect($scope.loadingActivities).toBe(true);
        });

        it('opens the activities popover', function () {
          expect($scope.$emit).toHaveBeenCalledWith('civicase::ActivitiesCalendar::openActivitiesPopover');
        });

        it('makes an api request to fetch all the activities for that date', function () {
          var formattedDay = moment(dates.today).format('YYYY-MM-DD');

          expect(crmApi).toHaveBeenCalledWith('Activity', 'get', jasmine.objectContaining({
            activity_date_time: {
              BETWEEN: [ formattedDay + ' 00:00:00', formattedDay + ' 23:59:59' ]
            },
            case_id: $scope.caseId,
            options: { limit: 0 }
          }));
        });

        describe('when the activities are loaded', function () {
          var ContactsDataService;

          beforeEach(inject(function (_ContactsDataService_) {
            ContactsDataService = _ContactsDataService_;
          }));

          beforeEach(function () {
            spyOn(ContactsDataService, 'add').and.callThrough();
            $scope.$digest();
          });

          it('formats all the activities', function () {
            expect(formatActivity.calls.count()).toBe(mockedActivities.length);
          });

          it('fetches the data of all the contacts assigned to the activities', function () {
            var activitiesContacts = _(mockedActivities)
              .pluck('case_id.contacts').flatten()
              .pluck('contact_id').value();

            expect(ContactsDataService.add).toHaveBeenCalledWith(activitiesContacts);
          });

          it('turns off the loading state', function () {
            expect($scope.loadingActivities).toBe(false);
          });

          it('stores the activities', function () {
            var mockedIds = _.pluck(mockedActivities, 'id');
            var selectedIds = _.pluck($scope.selectedActivites, 'id');

            expect(selectedIds).toEqual(mockedIds);
          });
        });
      });

      describe('when a date was already selected', function () {
        beforeEach(function () {
          initializeForDateSelect(true);
          $scope.selectedActivites = [jasmine.any(Object), jasmine.any(Object)];
          $scope.onDateSelected();
        });

        it('removes the previously selected activities from the scope', function () {
          expect($scope.selectedActivites.length).toBe(0);
        });
      });

      describe('when the same day is selected again', function () {
        beforeEach(function () {
          initializeForDateSelect(true);

          $scope.onDateSelected();
          $scope.$digest();
          crmApi.calls.reset();
          $scope.onDateSelected();
          $scope.$digest();
        });

        it('uses the cache instead of making an api request', function () {
          expect(crmApi).not.toHaveBeenCalled();
          expect($scope.selectedActivites.length).not.toBe(0);
        });
      });

      /**
       * Initializes the controller so that it's ready to execute the
       * onDateSelected() scope method
       *
       * @param {Boolean} returnDateFromApi
       *   whether the selected date should be returned as a date with activities
       */
      function initializeForDateSelect (returnDateFromApi) {
        initController();

        $scope.selectedDate = dates.today;

        if (returnDateFromApi) {
          generateMockActivities();
          returnDateForStatus(dates.today, 'any');
        }

        $rootScope.$emit('civicase::uibDaypicker::compiled');
        $scope.$digest();

        crmApi.calls.reset();
        crmApi.and.returnValue((function () {
          return $q.resolve({
            values: returnDateFromApi ? mockedActivities : []
          });
        }()));
      }
    });

    describe('refresh listener', function () {
      beforeEach(function () {
        initControllerAndEmitDatepickerReadyEvent();
        crmApi.calls.reset();
        $rootScope.$emit('civicase::ActivitiesCalendar::reload');
        $scope.$digest();
      });

      it('triggers a full reload', function () {
        expect(crmApi.calls.count()).toBe(2);
      });
    });

    /**
     * Generates some mock activities, each with an id and some contact ids
     */
    function generateMockActivities () {
      mockedActivities = _.times(5, function () {
        var obj = {};

        obj['id'] = _.uniqueId();
        obj['case_id.contacts'] = _.times(2, function () {
          return { contact_id: _.random(1, 5) };
        });

        return obj;
      });
    }

    /**
     * It returns the given date as part of the response of
     * the Activity.getdayswithactivities endpoint call for the given status type
     *
     * @param {String} date formatted in local time
     * @param {String} status any|completed|incomplete
     */
    function returnDateForStatus (date, status) {
      crmApi.and.callFake(function (entity, action, params) {
        var dates = [];
        var isCompleteActivitiesApiCall = params.status_id === CRM.civicase.activityStatusTypes.completed[0];
        var isIncompleteActivitiesApiCall = _.isEqual(params.status_id.IN, CRM.civicase.activityStatusTypes.incomplete);

        if (status === 'any' ||
          (status === 'completed' && isCompleteActivitiesApiCall) ||
          (status === 'incomplete' && isIncompleteActivitiesApiCall)) {
          dates = [ moment(date).format('YYYY-MM-DD') ];
        }

        return $q.resolve({ values: dates });
      });
    }

    /**
     * Initializes the activities calendar component
     */
    function initController ($params) {
      $controller('civicaseActivitiesCalendarController', {
        $scope: _.assign($scope, { caseId: _.uniqueId() }, $params)
      });
    }

    /**
     * initializes the controller and simulates the event that the
     * decorated uib-datepicker sends when it's compiled and attached to the DOM
     */
    function initControllerAndEmitDatepickerReadyEvent () {
      initController();
      $rootScope.$emit('civicase::uibDaypicker::compiled');
      $scope.$digest();
    }
  });

  describe('Activities Calendar DOM Events', function () {
    var $compile, $q, $rootScope, $scope, $timeout, $uibPosition, activitiesCalendar,
      crmApi, datepickerMock;

    beforeEach(module('civicase', 'civicase.data', 'civicase.templates', function ($compileProvider, $provide) {
      $uibPosition = jasmine.createSpyObj('$uibPosition', ['positionElements']);
      datepickerMock = jasmine.createSpyObj('datepicker', ['refreshView']);

      $uibPosition.positionElements.and.returnValue({ top: 0, left: 0 });
      $provide.value('$uibPosition', $uibPosition);
      $provide.decorator('uibDatepickerDirective', function ($delegate) {
        return [{
          restrict: 'A',
          scope: {},
          controller: function ($scope) {
            $scope.datepicker = datepickerMock;
          }
        }];
      });
    }));

    beforeEach(inject(function (_$compile_, _$q_, _$rootScope_, _$timeout_, _crmApi_) {
      $compile = _$compile_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      crmApi = _crmApi_;

      crmApi.and.returnValue($q.resolve({ values: [] }));

      $('<div id="bootstrap-theme"></div>').appendTo('body');
    }));

    afterEach(function () {
      activitiesCalendar && activitiesCalendar.remove();
      $('#bootstrap-theme').remove();
      $(document).off('mouseup');
    });

    describe('activities popover', function () {
      beforeEach(function () {
        initDirective();
      });

      describe('when the "open activities popover" event is emitted', function () {
        beforeEach(function () {
          activitiesCalendar.isolateScope().$emit('civicase::ActivitiesCalendar::openActivitiesPopover');
          $timeout.flush();
        });

        it('displays the activities popover', function () {
          expect($('.activities-calendar-popover').is(':visible')).toBe(true);
        });
      });

      describe('when the "open activities popover" event is not emitted', function () {
        it('does not display the activities popover', function () {
          expect($('.activities-calendar-popover').is(':visible')).toBe(false);
        });
      });

      describe('closing the popover', function () {
        beforeEach(function () {
          activitiesCalendar.isolateScope().$emit('civicase::ActivitiesCalendar::openActivitiesPopover');
          $timeout.flush();
        });

        describe('when clicking outside the popover', function () {
          beforeEach(function () {
            activitiesCalendar.parent().mouseup();
          });

          it('closes the popover', function () {
            expect($('.activities-calendar-popover').is(':visible')).toBe(false);
          });
        });

        describe('when clicking inside the popover', function () {
          beforeEach(function () {
            $('.activities-calendar-popover').mouseup();
          });

          it('does not close the popover', function () {
            expect($('.activities-calendar-popover').is(':visible')).toBe(true);
          });
        });
      });

      describe('opening the popover over the current selected date', function () {
        describe('when opening the popover', function () {
          var activeButton, expectedOffset, popover, jQueryOffsetFn;

          beforeEach(function () {
            var container = $('#bootstrap-theme');
            var mockBodyOffset = { top: 600, left: 500 };
            jQueryOffsetFn = $.fn.offset;

            // Mocking the offset method because the original can fail randomly:
            spyOn($.fn, 'offset').and.returnValue({ top: 200, left: 100 });

            popover = activitiesCalendar.find('.activities-calendar-popover');
            activeButton = activitiesCalendar.find('.uib-day .active');
            expectedOffset = {
              top: mockBodyOffset.top - container.offset().top + 'px',
              left: mockBodyOffset.left - container.offset().left + 'px'
            };

            popover.width(100);
            $uibPosition.positionElements.and.returnValue(mockBodyOffset);
            activitiesCalendar.isolateScope().$emit('civicase::ActivitiesCalendar::openActivitiesPopover');
            $timeout.flush();
          });

          afterEach(function () {
            $.fn.offset = jQueryOffsetFn;
          });

          it('appends the popover to the bootstrap theme element', function () {
            expect(popover.parent().is('#bootstrap-theme')).toBe(true);
          });

          it('gets the active element position relative to the body', function () {
            expect($uibPosition.positionElements).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), 'bottom', true);
            // this tests that the right elements have been passed to "positionElements":
            expect(activeButton.is($uibPosition.positionElements.calls.mostRecent().args[0])).toEqual(true);
            expect(popover.is($uibPosition.positionElements.calls.mostRecent().args[1])).toEqual(true);
          });

          it('has the same offset as the active day', function () {
            expect(popover.css(['top', 'left']))
              .toEqual(expectedOffset);
          });
        });
      });
    });

    /**
     * Appends a mock calendar table element inside the uib-datepicker element.
     */
    function appendMockCalendarTable () {
      var calendarTable = `<table>
        <thead>
          <tr>
            <th><button><i class="glyphicon glyphicon-chevron-left"></i></button></th>
            <th><button class="uib-title"><strong>Month Year</strong></button></th>
            <th><button><i class="glyphicon glyphicon-chevron-right"></i></button></th>
          </tr>
          <tr>
            <th>Mon</th>
            <th>Tue</th>
            <th>Wed</th>
            <th>Thu</th>
            <th>Fri</th>
            <th>Sat</th>
            <th>Sun</th>
          </tr>
        </thead>
        <tbody>
          <tr class="uib-weeks">
            <td class="uib-day">
              <button><span>06</span></button>
            </td>
            <td class="uib-day">
              <button><span>07</span></button>
            </td>
            <td class="uib-day">
              <button><span>08</span></button>
            </td>
            <td class="uib-day">
              <button class="active"><span>09</span></button>
            </td>
            <td class="uib-day">
              <button><span>10</span></button>
            </td>
            <td class="uib-day">
              <button><span>11</span></button>
            </td>
            <td class="uib-day">
              <button><span>12</span></button>
            </td>
          </tr>
        </tbody>
      </table>`;

      activitiesCalendar.find('[uib-datepicker]').html(calendarTable);
    }

    /**
     * Initializes the activities calendar dom events directive in the context of its
     * parent controller.
     *
     * @param {Array} activities a list of activity objects to pass to the directive's scope.
     *   defaults to all the activities mock data.
     */
    function initDirective (activities) {
      var html = `<civicase-activities-calendar
        refresh-callback="refresh">
      </civicase-activities-calendar>`;
      $scope = $rootScope.$new();
      $scope.refresh = _.noop;
      activitiesCalendar = $compile(html)($scope);

      activitiesCalendar.appendTo('body');
      $scope.$digest();
      appendMockCalendarTable();
      activitiesCalendar.find('.popover').hide(); // Bootstrap hides this automatically
    }
  });
})(CRM.$, CRM._, moment);
