(function() {
    function update_home_btn_state() {
        var $btn = $('.dux-home-btn');
        if (!$btn.length) return;

        var expanded = $('.body-sidebar-container').hasClass('expanded');
        if (expanded) {
            $btn.css({
                padding: '8px 16px',
                justifyContent: 'flex-start'
            });
            $btn.find('svg').css('margin-right', '6px');
            $btn.find('.dux-home-label').show();
        } else {
            $btn.css({
                padding: '8px',
                justifyContent: 'center'
            });
            $btn.find('svg').css('margin-right', '0');
            $btn.find('.dux-home-label').hide();
        }
    }

    function inject_sidebar_home() {
        if ($('.dux-home-btn').length) return;

        var btn = $('<a class="dux-home-btn" href="/app/dux-portal">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
            '<span class="dux-home-label" style="margin-left:6px">Home</span></a>');
        btn.css({
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            color: '#2563eb',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            borderBottom: '1px solid #f0f2f5',
            background: '#eff6ff',
            cursor: 'pointer'
        });
        btn.on('click', function(e) {
            e.preventDefault();
            frappe.set_route('dux-portal');
        });
        $('.sidebar-header').after(btn);
        update_home_btn_state();
    }

    // Sidebar is permanent - inject once on ready
    $(document).ready(function() {
        setTimeout(inject_sidebar_home, 500);

        // Watch .body-sidebar-container for class changes (expanded/collapsed)
        var sidebar = document.querySelector('.body-sidebar-container');
        if (sidebar) {
            var observer = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    if (mutations[i].attributeName === 'class') {
                        update_home_btn_state();
                        break;
                    }
                }
            });
            observer.observe(sidebar, { attributes: true });
        }
    });

    // Re-inject if sidebar re-renders (e.g. on login)
    $(document).on('page-change', function() {
        setTimeout(inject_sidebar_home, 300);
    });
})();
