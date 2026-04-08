import frappe

@frappe.whitelist()
def get_portal_data():
    user = frappe.session.user
    roles = frappe.get_roles(user)

    sections = frappe.get_all(
        "Portal Section",
        filters={"is_active": 1},
        fields=["name", "section_name", "color_theme", "icon_svg", "sort_order"],
        order_by="sort_order asc"
    )

    result = []
    for section in sections:
        links = frappe.get_all(
            "Portal Link",
            filters={"section": section["name"], "is_active": 1},
            fields=["name", "title", "description", "url", "icon_svg",
                    "visible_to", "role", "user", "sort_order"],
            order_by="sort_order asc"
        )
        visible_links = []
        for link in links:
            if link["visible_to"] == "All":
                visible_links.append(link)
            elif link["visible_to"] == "Role" and link["role"] in roles:
                visible_links.append(link)
            elif link["visible_to"] == "User" and link["user"] == user:
                visible_links.append(link)
            elif link["visible_to"] == "Roles":
                link_roles = frappe.get_all("Portal Link Role",
                    filters={"parent": link["name"]},
                    fields=["role"])
                if any(r["role"] in roles for r in link_roles):
                    visible_links.append(link)
            elif link["visible_to"] == "Roles & Users":
                link_roles = frappe.get_all("Portal Link Role",
                    filters={"parent": link["name"]},
                    fields=["role"])
                link_users = frappe.get_all("Portal Link User",
                    filters={"parent": link["name"]},
                    fields=["user"])
                role_match = any(r["role"] in roles for r in link_roles)
                user_match = any(u["user"] == user for u in link_users)
                if role_match or user_match:
                    visible_links.append(link)
        if visible_links:
            section["links"] = visible_links
            result.append(section)

    full_name = frappe.db.get_value("User", user, "full_name") or user

    # Get Dux Portal Settings
    settings = {
        "show_items_section": 0,
        "items_section_label": "My Items",
        "items_doctype": "",
        "items_display_field": "name",
        "items_abbr_field": "",
        "items_collapsed": 1,
        "items_visible_to_role": "",
        "portal_title": "Dux Portal",
        "footer_text": "Powered by Dux DigiTech",
        "logo": "",
        "logo_base64": "",
        "logo_height": 24,
        "logo_style": "Original"
    }
    try:
        ps = frappe.get_single("Dux Portal Settings")
        settings = {
            "show_items_section": ps.show_items_section,
            "items_section_label": ps.items_section_label or "My Items",
            "items_doctype": ps.items_doctype or "",
            "items_display_field": ps.items_display_field or "name",
            "items_abbr_field": ps.items_abbr_field or "",
            "items_collapsed": ps.items_collapsed,
            "items_visible_to_role": ps.items_visible_to_role or "",
            "portal_title": ps.portal_title or "Dux Portal",
            "footer_text": ps.footer_text or "Powered by Dux DigiTech",
            "logo": ps.logo or "",
            "logo_base64": ps.logo_base64 or "",
            "logo_height": ps.logo_height or 24,
            "logo_style": ps.logo_style or "Original"
        }
    except Exception:
        pass

    # Generate logo_base64 from file on every request
    import base64, os, mimetypes
    logo_base64 = ""
    try:
        logo_path = frappe.db.sql("SELECT value FROM tabSingles WHERE doctype='Dux Portal Settings' AND field='logo'")
        if logo_path and logo_path[0][0]:
            url = logo_path[0][0]
            if url.startswith("/private/"):
                fpath = frappe.get_site_path("private", "files", os.path.basename(url))
            else:
                fpath = frappe.get_site_path("public", "files", os.path.basename(url))
            if os.path.exists(fpath):
                mime = mimetypes.guess_type(fpath)[0] or "image/png"
                with open(fpath, "rb") as f:
                    logo_base64 = "data:" + mime + ";base64," + base64.b64encode(f.read()).decode()
    except Exception as e:
        frappe.log_error(str(e), "Logo base64 error")
    settings["logo_base64"] = logo_base64

    # Get items from User Permissions
    items = []
    try:
        if (settings.get("show_items_section") and
            settings.get("items_doctype") and
            (not settings.get("items_visible_to_role") or
             settings.get("items_visible_to_role") in roles)):

            dt = settings["items_doctype"]
            display_field = settings["items_display_field"] or "name"
            abbr_field = settings["items_abbr_field"] or ""
            fields = [display_field]
            if abbr_field:
                fields.append(abbr_field)

            meta = frappe.get_meta(dt)
            has_is_group = meta.has_field("is_group")

            if "System Manager" in roles:
                filters = [["is_group", "=", 0]] if has_is_group else []
                all_items = frappe.get_all(
                    dt,
                    filters=filters,
                    fields=fields,
                    order_by=display_field + " asc",
                    limit=500
                )
                for item in all_items:
                    entry = {"name": item.get(display_field, "")}
                    if abbr_field and item.get(abbr_field):
                        entry["abbr"] = item.get(abbr_field)
                    items.append(entry)
            else:
                perms = frappe.get_all(
                    "User Permission",
                    filters={"user": user, "allow": dt},
                    fields=["for_value"],
                    limit=200
                )
                item_names = [p["for_value"] for p in perms]
                if item_names:
                    item_docs = frappe.get_all(
                        dt,
                        filters=[[display_field, "in", item_names]],
                        fields=fields,
                        order_by=display_field + " asc"
                    )
                    for item in item_docs:
                        entry = {"name": item.get(display_field, "")}
                        if abbr_field and item.get(abbr_field):
                            entry["abbr"] = item.get(abbr_field)
                        items.append(entry)
    except Exception as e:
        frappe.log_error(str(e), "Dux Portal get_items error")

    ic_pending = 0
    try:
        from dux_voucher.dux_voucher.api.ic_transfer_api import get_pending_ic_entries_count
        user_companies = [i["name"] for i in items] if items else []
        if not user_companies and "System Manager" in roles:
            all_cos = frappe.get_all("Company", filters={"is_group": 0}, fields=["name"])
            user_companies = [c.name for c in all_cos]
        if user_companies:
            ic_pending = get_pending_ic_entries_count(user_companies)
    except Exception:
        pass

    return {
        "user": user,
        "full_name": full_name,
        "sections": result,
        "items": items,
        "settings": settings,
        "ic_pending": ic_pending
    }
