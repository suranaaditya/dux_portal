frappe.pages['dux-portal'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Home',
		single_column: true
	});

	$(wrapper).find('.page-title').hide();
	$(wrapper).find('.page-head').css('display', 'none');

	frappe.call({
		method: 'dux_portal.dux_portal.api.get_portal_data',
		callback: function(r) {
			if (r.message) {
				render_portal(wrapper, r.message);
			}
		}
	});
};

function get_theme_colors(theme) {
	var themes = {
		'Blue':   { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', accent: '#2563eb' },
		'Green':  { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', accent: '#059669' },
		'Amber':  { bg: '#fffbeb', text: '#d97706', border: '#fde68a', accent: '#d97706' },
		'Purple': { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', accent: '#7c3aed' },
		'Red':    { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3', accent: '#e11d48' },
		'Slate':  { bg: '#f8fafc', text: '#475569', border: '#cbd5e1', accent: '#475569' },
	};
	return themes[theme] || themes['Blue'];
}

function get_greeting() {
	var h = new Date().getHours();
	return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function get_initials(name) {
	return (name || '').trim().split(' ').map(function(p) { return p[0] || ''; }).slice(0, 2).join('').toUpperCase();
}

function get_logo_filter(style) {
	if (style === 'Make Black') return 'filter:invert(1) brightness(0) saturate(0);';
	if (style === 'Make White') return 'filter:brightness(0) invert(1);';
	return '';
}

function render_portal(wrapper, data) {
	var settings = data.settings || {};
	var portal_title = settings.portal_title || 'Dux Portal';
	var footer_text = settings.footer_text || 'Powered by Dux DigiTech';
	var logo_base64 = settings.logo_base64 || '';
	var logo_height = settings.logo_height || 24;
	var logo_style = settings.logo_style || 'Original';

	// Build topbar brand
	var brand_html;
	if (logo_base64) {
		brand_html = '<img src="' + logo_base64 + '" alt="' + portal_title + '" height="' + logo_height + '" style="display:block;' + get_logo_filter(logo_style) + '" />';
	} else {
		brand_html = '<strong style="font-size:15px;color:var(--dp-tx)">' + portal_title + '</strong>';
	}

	// Build sections
	var sections_html = '';
	data.sections.forEach(function(section) {
		var colors = get_theme_colors(section.color_theme);
		var links_html = '';

		section.links.forEach(function(link) {
			var icon_name = link.icon_svg;
			var icon_paths = (window.DUX_ICONS && icon_name && DUX_ICONS[icon_name]) ? DUX_ICONS[icon_name] : '<rect x="3" y="3" width="18" height="18" rx="2"/>';
			var icon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icon_paths + '</svg>';
			links_html += '<a href="' + link.url + '" class="dp-card">' +
				'<div class="dp-card-top">' +
					'<div class="dp-card-ico" style="background:' + colors.bg + '">' +
						'<span style="color:' + colors.text + ';width:18px;height:18px;display:flex">' + icon + '</span>' +
					'</div>' +
					'<div class="dp-card-arrow">' +
						'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="9 18 15 12 9 6"/></svg>' +
					'</div>' +
				'</div>' +
				'<div>' +
					'<div class="dp-card-title">' + link.title + '</div>' +
					'<div class="dp-card-desc">' + (link.description || '') + '</div>' +
				'</div>' +
			'</a>';
		});

		var sec_icon_name = section.icon_svg;
		var sec_icon_paths = (window.DUX_ICONS && sec_icon_name && DUX_ICONS[sec_icon_name]) ? DUX_ICONS[sec_icon_name] : '<circle cx="12" cy="12" r="10"/>';
		var sec_icon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + sec_icon_paths + '</svg>';

		sections_html += '<div class="dp-section">' +
			'<div class="dp-sec-hdr" style="border-left: 3px solid ' + colors.accent + '">' +
				'<span class="dp-sec-icon" style="color:' + colors.text + '">' + sec_icon + '</span>' +
				'<span class="dp-sec-title" style="color:' + colors.text + '">' + section.section_name.toUpperCase() + '</span>' +
			'</div>' +
			'<div class="dp-grid">' + links_html + '</div>' +
		'</div>';
	});

	// Build My Items section
	var items_html = '';
	if (settings.show_items_section && data.items && data.items.length) {
		var items_label = settings.items_section_label || 'My Items';
		var is_collapsed = settings.items_collapsed ? 1 : 0;

		var items_cards = '';
		data.items.forEach(function(item) {
			var abbr = item.abbr || get_initials(item.name);
			items_cards += '<div class="dp-item-card">' +
				'<div class="dp-item-abbr">' + abbr + '</div>' +
				'<div class="dp-item-name">' + item.name + '</div>' +
			'</div>';
		});

		items_html = '<div class="dp-section">' +
			'<div class="dp-sec-hdr dp-items-toggle" style="border-left:3px solid var(--dp-accent);cursor:pointer">' +
				'<span class="dp-sec-icon" style="color:var(--dp-accent)"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg></span>' +
				'<span class="dp-sec-title" style="color:var(--dp-accent)">' + items_label.toUpperCase() + '</span>' +
				'<span style="margin-left:auto;font-size:11px;color:var(--dp-tx3)">' + data.items.length + ' items</span>' +
				'<span class="dp-items-chevron" style="color:var(--dp-tx3);transition:transform .2s;transform:rotate(' + (is_collapsed ? '0' : '180') + 'deg)"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span>' +
			'</div>' +
			'<div class="dp-items-body" style="' + (is_collapsed ? 'display:none' : '') + '">' +
				'<div class="dp-items-grid">' + items_cards + '</div>' +
			'</div>' +
		'</div>';
	}

	var now = new Date();
	var fy_start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	var fy_end = String(fy_start + 1).slice(2);

	var html = '<style>' +
		':root {' +
			'--dp-bg: #f5f6f8;' +
			'--dp-surface: #ffffff;' +
			'--dp-surface2: #f9fafb;' +
			'--dp-surface3: #f0f2f5;' +
			'--dp-bd: #e5e7eb;' +
			'--dp-tx: #111827;' +
			'--dp-tx2: #6b7280;' +
			'--dp-tx3: #9ca3af;' +
			'--dp-accent: #2563eb;' +
			'--dp-radius: 10px;' +
			'--dp-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);' +
			'--dp-shadow2: 0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);' +
		'}' +
		'.dp-wrap { font-family: var(--font-stack, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); background: var(--dp-bg); min-height: 100vh; padding-bottom: 60px; }' +
		'.dp-topbar { background: var(--dp-surface); border-bottom: 1px solid var(--dp-bd); padding: 0 40px; box-shadow: var(--dp-shadow); }' +
		'.dp-topbar-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 52px; gap: 16px; }' +
		'.dp-tb-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }' +
		'.dp-time { font-family: monospace; font-size: 11px; color: var(--dp-tx3); }' +
		'.dp-user-pill { display: flex; align-items: center; gap: 8px; background: var(--dp-surface2); border: 1px solid var(--dp-bd); border-radius: 8px; padding: 5px 10px; }' +
		'.dp-gv-pill { display: flex; align-items: center; gap: 8px; background: var(--dp-surface2); border: 1px solid var(--dp-bd); border-radius: 8px; padding: 5px 10px; font-size: 13px; font-weight: 500; color: var(--dp-tx); text-decoration: none; transition: background .12s; }' +
		'.dp-gv-pill:hover { background: #f0f4ff; color: var(--dp-tx); text-decoration: none; }' +
		'.dp-gv-pill:focus-visible { outline: 2px solid var(--dp-accent); outline-offset: 2px; }' +
		'.dp-gv-pill svg { width: 14px; height: 14px; color: var(--dp-tx2); flex-shrink: 0; }' +
		'.dp-avatar { width: 24px; height: 24px; border-radius: 6px; background: var(--dp-accent); color: #fff; font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; }' +
		'.dp-uname { font-size: 13px; font-weight: 500; color: var(--dp-tx); }' +
		'.dp-main { max-width: 1200px; margin: 0 auto; padding: 32px 40px; }' +
		'.dp-hero { background: var(--dp-surface); border: 1px solid var(--dp-bd); border-radius: var(--dp-radius); padding: 28px 32px; margin-bottom: 20px; box-shadow: var(--dp-shadow); display: flex; align-items: center; justify-content: space-between; gap: 20px; }' +
		'.dp-hero h1 { font-size: 22px; font-weight: 600; color: var(--dp-tx); margin-bottom: 4px; }' +
		'.dp-hero h1 em { font-style: normal; color: var(--dp-accent); }' +
		'.dp-hero-sub { font-size: 13px; color: var(--dp-tx2); }' +
		'.dp-fy { text-align: right; flex-shrink: 0; }' +
		'.dp-fy-label { font-size: 10px; color: var(--dp-tx3); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }' +
		'.dp-fy-value { font-size: 18px; font-weight: 600; color: var(--dp-tx); font-family: monospace; }' +
		'.dp-section { background: var(--dp-surface); border: 1px solid var(--dp-bd); border-radius: var(--dp-radius); margin-bottom: 16px; box-shadow: var(--dp-shadow); overflow: hidden; }' +
		'.dp-sec-hdr { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: var(--dp-surface2); border-bottom: 1px solid var(--dp-bd); }' +
		'.dp-sec-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }' +
		'.dp-sec-icon svg { width: 14px; height: 14px; }' +
		'.dp-sec-title { font-size: 11px; font-weight: 600; letter-spacing: .07em; }' +
		'.dp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1px; background: var(--dp-bd); }' +
		'.dp-card { background: var(--dp-surface); padding: 20px; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 12px; transition: background .12s; position: relative; }' +
		'.dp-card:hover { background: #f0f4ff; }' +
		'.dp-card-top { display: flex; align-items: flex-start; justify-content: space-between; }' +
		'.dp-card-ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }' +
		'.dp-card-ico svg { width: 18px; height: 18px; }' +
		'.dp-card-arrow { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: var(--dp-surface3); border: 1px solid var(--dp-bd); }' +
		'.dp-card-arrow svg { stroke: var(--dp-tx3); }' +
		'.dp-card-title { font-size: 14px; font-weight: 600; color: var(--dp-tx); margin-bottom: 3px; }' +
		'.dp-card-desc { font-size: 12px; color: var(--dp-tx2); line-height: 1.5; }' +
		'.dp-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px; background: var(--dp-bd); }' +
		'.dp-item-card { background: var(--dp-surface); padding: 14px 16px; display: flex; align-items: center; gap: 10px; }' +
		'.dp-item-abbr { width: 32px; height: 32px; border-radius: 8px; background: var(--dp-accent); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
		'.dp-item-name { font-size: 13px; font-weight: 500; color: var(--dp-tx); }' +
		'.dp-foot { border-top: 1px solid var(--dp-bd); padding: 12px 40px; margin-top: 8px; }' +
		'.dp-foot-inner { max-width: 1200px; margin: 0 auto; text-align: center; font-size: 11px; color: var(--dp-tx3); font-family: monospace; }' +
		'@media(max-width:640px) { .dp-main, .dp-topbar, .dp-foot { padding-left: 16px; padding-right: 16px; } .dp-hero { flex-direction: column; align-items: flex-start; } .dp-grid { grid-template-columns: 1fr 1fr; } .dp-items-grid { grid-template-columns: 1fr; } }' +
	'</style>' +
	'<div class="dp-wrap">' +
		'<div class="dp-topbar">' +
			'<div class="dp-topbar-inner">' +
				brand_html +
				'<div class="dp-tb-right">' +
					'<span class="dp-time" id="dp-clock">--:--</span>' +
					(data.show_groupview_pill ?
						'<a class="dp-gv-pill" href="/app/groupview">' +
							'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
								'<rect width="7" height="9" x="3" y="3" rx="1"/>' +
								'<rect width="7" height="5" x="14" y="3" rx="1"/>' +
								'<rect width="7" height="9" x="14" y="12" rx="1"/>' +
								'<rect width="7" height="5" x="3" y="16" rx="1"/>' +
							'</svg>' +
							'<span>Financial Cockpit</span>' +
						'</a>'
					: '') +
					'<div class="dp-user-pill">' +
						'<div class="dp-avatar">' + get_initials(data.full_name) + '</div>' +
						'<span class="dp-uname">' + data.full_name + '</span>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="dp-main">' +
			'<div class="dp-hero">' +
				'<div>' +
					'<div style="font-size:10px;color:var(--dp-tx3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;font-family:monospace">' + portal_title + '</div>' +
					'<h1>Good <em>' + get_greeting() + '</em>, ' + data.full_name.split(' ')[0] + '</h1>' +
					'<p class="dp-hero-sub">Welcome to your dashboard</p>' +
				'</div>' +
				'<div class="dp-fy">' +
					'<div class="dp-fy-label">Financial Year</div>' +
					'<div class="dp-fy-value">FY ' + fy_start + '\u2013' + fy_end + '</div>' +
				'</div>' +
			'</div>' +
			items_html +
			sections_html +
		'</div>' +
		'<div class="dp-foot">' +
			'<div class="dp-foot-inner">' + footer_text + '</div>' +
		'</div>' +
	'</div>';

	$(wrapper).find('.layout-main-section').html(html);

	// IC Transfer pending notification — appended after render, safe fallback
	if (data.ic_pending && data.ic_pending > 0) {
		var $hero = $(wrapper).find('.dp-hero');
		if ($hero.length) {
			var $notif = $('<div>')
				.css({
					'margin-top': '10px',
					'display': 'inline-flex',
					'align-items': 'center',
					'gap': '8px',
					'background': '#fff7ed',
					'border': '1px solid #fed7aa',
					'border-radius': '8px',
					'padding': '7px 14px',
					'font-size': '13px',
					'color': '#c2410c',
					'font-weight': '500',
					'cursor': 'pointer',
				})
				.html(
					'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
					'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">' +
					'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> ' +
					data.ic_pending + ' inter-company transfer' +
					(data.ic_pending > 1 ? 's' : '') + ' pending your confirmation'
				)
				.on('click', function() {
					frappe.set_route('query-report', 'ICT Pending Confirmation');
				});
			$hero.append($notif);
		}
	}

	// Items section toggle
	$(wrapper).find('.dp-items-toggle').on('click', function() {
		var $body = $(this).closest('.dp-section').find('.dp-items-body');
		var $chevron = $(this).find('.dp-items-chevron');
		$body.slideToggle(200);
		var current = $chevron.css('transform');
		if (current === 'none' || current.indexOf('matrix') === -1) {
			$chevron.css('transform', 'rotate(180deg)');
		} else {
			var isOpen = current.indexOf('-1') > -1;
			$chevron.css('transform', isOpen ? 'rotate(0deg)' : 'rotate(180deg)');
		}
	});

	// Live clock
	function update_clock() {
		var now = new Date();
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var el = document.getElementById('dp-clock');
		if (el) el.textContent = now.getDate() + ' ' + months[now.getMonth()] + ' \u00b7 ' +
			String(now.getHours()).padStart(2,'0') + ':' +
			String(now.getMinutes()).padStart(2,'0') + ':' +
			String(now.getSeconds()).padStart(2,'0');
	}
	update_clock();
	setInterval(update_clock, 1000);
}
