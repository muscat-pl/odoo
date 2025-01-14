# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from markupsafe import Markup
from odoo import api, fields, models, _
from odoo.tools.mail import is_html_empty


class CrmLeadLost(models.TransientModel):
    _name = 'crm.lead.lost'
    _description = 'Get Lost Reason'

    set_reason = fields.Boolean(string='Set a Loss Reason', compute='_compute_set_reason',
                                readonly=False, store=True)
    lead_ids = fields.Many2many('crm.lead', string='Leads')
    lost_reason_id = fields.Many2one('crm.lost.reason', 'Lost Reason')
    lost_feedback = fields.Html(
        'Closing Note', sanitize=True
    )

    @api.depends('lead_ids')
    def _compute_set_reason(self):
        for wizard in self:
            wizard.set_reason = bool(wizard.lead_ids.filtered(lambda lead: lead.type == 'opportunity'))

    def action_lost_reason_apply(self):
        """Mark lead as lost and apply the loss reason"""
        self.ensure_one()
        if not is_html_empty(self.lost_feedback):
            self.lead_ids._track_set_log_message(
                Markup('<div style="margin-bottom: 4px;"><p>%s:</p>%s<br /></div>') % (
                    _('Lost Comment'),
                    self.lost_feedback
                )
            )
        res = self.lead_ids.action_set_lost(lost_reason_id=self.lost_reason_id.id)
        return res
