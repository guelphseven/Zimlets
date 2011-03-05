/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 * original by:
 * @author Raja Rao DV rrao@zimbra.com
 * revised by:
 * @author Wyatt Carss carss.w@gmail.com
 * @author Paul Vilchez vilchez.paul@gmail.com
 *
 * Checks for to see if there are 3 or more addresses in the BCC field.
 * If the email has too many addresses, throws bcc-suggestion alert dialog
 */

/**
 * Constructor
 */
function com_guelphseven_bccalert_HandlerObject() {
}

com_guelphseven_bccalert_HandlerObject.prototype = new ZmZimletBase();
com_guelphseven_bccalert_HandlerObject.prototype.constructor = com_guelphseven_bccalert_HandlerObject;

/**
 * Simplify Zimlet handler name.
 */
var bccalertZimlet = com_guelphseven_bccalert_HandlerObject;

/**
 * Defines the "zimlet name".
 */
bccalertZimlet.ZIMLET_NAME = "bccalertZimlet";
/**
 * Defines the "alert on" user property.
 */
bccalertZimlet.USER_PROP_alert_ON = "turnONbccalertZimletNew";

/**
 * Defines the "alert on checkbox" element.
 */
bccalertZimlet.ELEMENT_ID_CHECKBOX_alert_ON = "turnONbccalertZimletNew_chkbx";


/**
 * Initializes the zimlet.
 *
 */
bccalertZimlet.prototype.init =
function() {
	this.turnONbccalertZimletNew = this.getUserProperty(bccalertZimlet.USER_PROP_alert_ON) == "true";
};

/**
 * This method is called when sending an email. This function checks and sets/pushes value to
 * boolAndErrorMsgArray indicating if there was an error or not. If there was an error(i.e. attachment is missing),
 * then it will push {hasError:true, errorMsg:"bcc suggestion", zimletName:"bccalertZimlet"} hash-object to boolAndErrorMsgArray array.
 *  If there are no errors, it will simply return <code>null</code>.
 *
 * @param {ZmMailMsg} mail 		the mail object
 * @param {array} boolAndErrorMsgArray	an array of hash objects
 */
bccalertZimlet.prototype.emailErrorCheck =
function(mail, boolAndErrorMsgArray) {
	if (!this.turnONbccalertZimletNew)
		return;

	// if there are few enough mail addresses in TO, return without error
	if(mail._addrs.TO._array.length <= 3) {
		return null;
	}
	
	// populate parameter array to send to dialog
	var errParams = {
		hasError:true,
		errorMsg: "You have more than 3 addresses in your To: field, it might be smart to use Bcc: instead. Continue anyway?",
		zimletName:bccalertZimlet.ZIMLET_NAME
	};
	
	return boolAndErrorMsgArray.push(errParams);
};

/**
 * Called when the zimlet is double-clicked.
 */
bccalertZimlet.prototype.doubleClicked = function() {
	this.singleClicked();
};

/**
 * Called when the zimlet is single-clicked.
 */
bccalertZimlet.prototype.singleClicked = function() {
	this._showPrefDialog();
};

/**
 * Shows the preferences dialog.
 *
 */
bccalertZimlet.prototype._showPrefDialog =
function() {
	//if zimlet dialog already exists...
	if (this.pbDialog) {
		this.pbDialog.popup();
		return;
	}
	this.pView = new DwtComposite(this.getShell());
	this.pView.getHtmlElement().innerHTML = this._createPrefView();

	if (this.getUserProperty(bccalertZimlet.USER_PROP_alert_ON) == "true") {
		document.getElementById(bccalertZimlet.ELEMENT_ID_CHECKBOX_alert_ON).checked = true;
	}

	var dialog_args = {
			title	: "BCC Alert: Preferences",
			view	: this.pView,
			standardButtons	: [DwtDialog.OK_BUTTON],
			parent	: this.getShell()
		};

	this.pbDialog = new ZmDialog(dialog_args);
	this.pbDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okBtnListner));
	this.pbDialog.popup();
};

/**
 * Creates the preferences view.
 *
 */
bccalertZimlet.prototype._createPrefView =
function() {
    var html = new Array();
    var i = 0;
    html[i++] = "<div>";
    html[i++] = "<input id='";
    html[i++] = bccalertZimlet.ELEMENT_ID_CHECKBOX_alert_ON;
    html[i++] = "'  type='checkbox'/>";
    html[i++] = "Enable \"BCC Alert\" Zimlet (will require a browser refresh)";
    html[i++] = "</div>";
    return html.join("");
};

/**
 * Listens for the OK button event.
 *
 * @see		_showPrefDialog
 */
bccalertZimlet.prototype._okBtnListner =
function() {
	this._reloadRequired = false;
	if (document.getElementById(bccalertZimlet.ELEMENT_ID_CHECKBOX_alert_ON).checked) {
		if (!this.turnONbccalertZimletNew) {
			this._reloadRequired = true;
		}
		this.setUserProperty(bccalertZimlet.USER_PROP_alert_ON, "true", true);
	} else {
		this.setUserProperty(bccalertZimlet.USER_PROP_alert_ON, "false", true);
		if (this.turnONbccalertZimletNew)
			this._reloadRequired = true;
	}
	this.pbDialog.popdown();
	if (this._reloadRequired) {
		window.onbeforeunload = null;
		var url = AjxUtil.formatUrl({});
		ZmZimbraMail.sendRedirect(url);
	}
};
