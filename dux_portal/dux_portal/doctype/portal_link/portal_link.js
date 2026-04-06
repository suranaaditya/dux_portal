frappe.ui.form.on('Portal Link', {
    refresh: function(frm) {
        frm.add_custom_button('Pick Icon', function() {
            if (!window.DUX_ICONS) {
                frappe.msgprint('Icon library not loaded. Please hard refresh (Ctrl+Shift+R).');
                return;
            }
            dux_portal_show_icon_dialog(frm, 'icon_svg');
        }, 'Icon');

        var current = frm.doc.icon_svg;
        if (current && window.DUX_ICONS && DUX_ICONS[current]) {
            var svg = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + DUX_ICONS[current] + '</svg>';
            var $wrapper = frm.get_field('icon_svg').$wrapper;
            $wrapper.find('.dp-icon-preview').remove();
            $wrapper.append('<div class="dp-icon-preview" style="margin-top:8px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">' + svg + '<span style="font-size:13px;color:#2563eb;font-family:monospace">' + current + '</span></div>');
        }
    }
});
