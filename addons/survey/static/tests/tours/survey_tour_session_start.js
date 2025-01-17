/** @odoo-module **/

import { registry } from "@web/core/registry";
import surveySessionTools from "survey.session_tour_tools";

/**
 * Small tour that will open the session manager and check
 * that the attendees are accounted for, then start the session
 * by going to the first question.
 */
registry.category("web_tour.tours").add('test_survey_session_start_tour', {
    url: "/web",
    test: true,
    steps: [].concat(surveySessionTools.accessSurveySteps, [{
    trigger: 'button[name="action_open_session_manager"]',
}, {
    trigger: '.o_survey_session_attendees_count:contains("3")',
    run: function () {} // check attendees count
}, {
    trigger: 'h1',
    run: function () {
        var e = $.Event('keydown');
        e.keyCode = 39; // arrow-right
        $(document).trigger(e); // start session
    }
}, {
    trigger: 'h1:contains("Nickname")',
    run: function () {} // check first question is displayed
}])});
