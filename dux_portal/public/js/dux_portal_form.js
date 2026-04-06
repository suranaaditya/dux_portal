function dux_portal_add_icon_picker(frm, fieldname) {
    frm.add_custom_button('Pick Icon', function() {
        dux_portal_show_icon_dialog(frm, fieldname);
    }, 'Icon');

    // Show current icon preview if set
    var current = frm.doc[fieldname];
    if (current && window.DUX_ICONS && DUX_ICONS[current]) {
        var svg = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + DUX_ICONS[current] + '</svg>';
        var $field = frm.get_field(fieldname).$wrapper;
        $field.find('.dp-icon-preview').remove();
        $field.append('<div class="dp-icon-preview" style="margin-top:8px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">' + svg + '<span style="font-size:13px;color:#2563eb;font-family:monospace">' + current + '</span></div>');
    }
}

function dux_portal_show_icon_dialog(frm, fieldname) {
    if (!window.DUX_ICONS) {
        frappe.msgprint('Icon library not loaded. Please hard refresh (Ctrl+Shift+R).');
        return;
    }

    var icon_categories = {
        'Finance': ['dollar-sign','indian-rupee','banknote','credit-card','wallet','coins','piggy-bank','landmark','scale','circle-dollar-sign','percent','calculator','sigma','receipt','receipt-text','hand-coins','arrow-left-right'],
        'Documents': ['file-text','file-plus','file-check','file-minus','clipboard','clipboard-check','clipboard-list','book-open','book','scroll-text','archive','save','copy','pen-line'],
        'People': ['users','user','user-check','user-plus','id-card','graduation-cap','briefcase'],
        'Business': ['building','building-2','factory','warehouse','hard-hat','store','map-pin','globe','network','git-branch'],
        'Stock': ['package','package-check','boxes','barcode','scan','truck','shopping-cart','shopping-bag','wrench','repeat','arrow-up-down'],
        'Reports': ['bar-chart','bar-chart-2','pie-chart','trending-up','trending-down','activity','line-chart','gauge','table','kanban','database','sliders'],
        'Compliance': ['shield-check','shield-alert','lock','shield','key','check-circle','check-square','x-circle'],
        'Schedule': ['calendar','calendar-check','clock','alarm-clock','timer','hourglass','history'],
        'Actions': ['edit','plus','trash','search','filter','download','upload','send','refresh-cw','check','printer','share','external-link','log-in','log-out'],
        'General': ['home','settings','bell','mail','phone','grid','list','layout','layers','folder','star','bookmark','tag','flag','info','help-circle','alert-triangle','zap','target','award','link','eye','code','monitor','message-square','map','compass','heart']
    };

    var all_icons = [];
    Object.keys(icon_categories).forEach(function(cat) {
        all_icons = all_icons.concat(icon_categories[cat]);
    });

    var selected_icon = frm.doc[fieldname] || '';
    var active_cat = 'All';

    // Remove existing modal if any
    $('#dp-icon-modal').remove();

    // Build modal HTML
    var modal_html = '<div id="dp-icon-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center">' +
        '<div style="background:#fff;border-radius:12px;width:780px;max-width:95vw;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">' +
            '<div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">' +
                '<span style="font-size:16px;font-weight:600;color:#111827">Pick an Icon</span>' +
                '<button id="dp-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280;line-height:1">&times;</button>' +
            '</div>' +
            '<div style="padding:12px 16px;border-bottom:1px solid #e5e7eb">' +
                '<input id="dp-icon-search" type="text" placeholder="Search icons \u2014 dollar, report, user, file..." style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;outline:none" />' +
            '</div>' +
            '<div style="padding:8px 16px;border-bottom:1px solid #e5e7eb;display:flex;flex-wrap:wrap;gap:4px" id="dp-cat-bar">' +
            '</div>' +
            '<div id="dp-icon-grid" style="padding:12px 16px;overflow-y:auto;flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:5px">' +
            '</div>' +
            '<div style="padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">' +
                '<div id="dp-sel-bar" style="display:flex;align-items:center;gap:8px"></div>' +
                '<div style="display:flex;gap:8px">' +
                    '<button id="dp-modal-cancel" style="padding:7px 16px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:13px">Cancel</button>' +
                    '<button id="dp-modal-select" style="padding:7px 16px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-size:13px;font-weight:500">Select Icon</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';

    $('body').append(modal_html);

    function mk_svg(name, size, color) {
        size = size || 20;
        color = color || 'currentColor';
        return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (DUX_ICONS[name] || '') + '</svg>';
    }

    var cats = ['All'].concat(Object.keys(icon_categories));
    var $cat_bar = $('#dp-cat-bar');
    cats.forEach(function(cat) {
        var $btn = $('<button>')
            .text(cat)
            .attr('data-cat', cat)
            .css({padding:'3px 10px', fontSize:'11px', borderRadius:'20px', border:'1px solid #e5e7eb', cursor:'pointer', background: cat === 'All' ? '#eff6ff' : '#fff', color: cat === 'All' ? '#2563eb' : '#6b7280'});
        $cat_bar.append($btn);
    });

    function update_cats() {
        $cat_bar.find('button').each(function() {
            var is_active = $(this).data('cat') === active_cat;
            $(this).css({background: is_active ? '#eff6ff' : '#fff', color: is_active ? '#2563eb' : '#6b7280', border: is_active ? '1px solid #bfdbfe' : '1px solid #e5e7eb'});
        });
    }

    function render_grid() {
        var q = ($('#dp-icon-search').val() || '').toLowerCase().trim();
        var icons_to_show = active_cat === 'All' ? all_icons : (icon_categories[active_cat] || []);
        if (q) icons_to_show = icons_to_show.filter(function(n) { return n.includes(q); });

        var html = icons_to_show.map(function(name) {
            var is_sel = name === selected_icon;
            return '<div class="dp-icon-cell" data-name="' + name + '" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px 7px;border-radius:8px;border:' + (is_sel ? '2px solid #2563eb' : '1px solid #e5e7eb') + ';cursor:pointer;background:' + (is_sel ? '#eff6ff' : '#fff') + '">' +
                mk_svg(name, 20, is_sel ? '#2563eb' : '#374151') +
                '<span style="font-size:9px;color:#9ca3af;text-align:center;word-break:break-all;line-height:1.3">' + name + '</span>' +
            '</div>';
        }).join('');

        $('#dp-icon-grid').html(html);

        // Update selection bar
        if (selected_icon && DUX_ICONS[selected_icon]) {
            $('#dp-sel-bar').html(mk_svg(selected_icon, 24, '#2563eb') + '<span style="font-family:monospace;color:#2563eb;font-size:13px">' + selected_icon + '</span>');
        } else {
            $('#dp-sel-bar').html('<span style="font-size:12px;color:#9ca3af">No icon selected</span>');
        }
    }

    // Event listeners — attached once, never removed by re-render
    $('#dp-icon-search').on('input', function() {
        render_grid();
    });

    $cat_bar.on('click', 'button', function() {
        active_cat = $(this).data('cat');
        update_cats();
        render_grid();
    });

    $('#dp-icon-grid').on('click', '.dp-icon-cell', function() {
        selected_icon = $(this).data('name');
        render_grid();
    });

    $('#dp-modal-close, #dp-modal-cancel').on('click', function() {
        $('#dp-icon-modal').remove();
    });

    $('#dp-modal-select').on('click', function() {
        if (selected_icon) {
            frm.set_value(fieldname, selected_icon);
            frm.save();
            setTimeout(function() {
                dux_portal_add_icon_picker(frm, fieldname);
            }, 500);
        }
        $('#dp-icon-modal').remove();
    });

    // Close on backdrop click
    $('#dp-icon-modal').on('click', function(e) {
        if ($(e.target).is('#dp-icon-modal')) {
            $('#dp-icon-modal').remove();
        }
    });

    // Focus search input after modal opens
    setTimeout(function() {
        $('#dp-icon-search').focus();
    }, 100);

    render_grid();
}
