# Copyright (c) 2026, Dux Digitech and contributors
# For license information, please see license.txt

import frappe
import base64
import mimetypes
from frappe.model.document import Document


class DuxPortalSettings(Document):
	def on_update(self):
		self.convert_logo_to_base64()

	def convert_logo_to_base64(self):
		if not self.logo:
			if self.logo_base64:
				frappe.db.set_single_value("Dux Portal Settings", "logo_base64", "")
			return

		try:
			file_path = frappe.get_site_path(
				"private" if self.logo.startswith("/private/") else "public",
				"files",
				self.logo.split("/files/")[-1]
			)

			with open(file_path, "rb") as f:
				file_data = f.read()

			mime_type = mimetypes.guess_type(self.logo)[0] or "image/png"
			b64 = base64.b64encode(file_data).decode("utf-8")
			data_url = "data:{};base64,{}".format(mime_type, b64)

			frappe.db.set_single_value("Dux Portal Settings", "logo_base64", data_url)
		except Exception as e:
			frappe.log_error(str(e), "Dux Portal logo base64 conversion error")
