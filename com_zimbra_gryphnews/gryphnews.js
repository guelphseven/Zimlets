/*
 * ***** BEGIN LICENSE BLOCK *****
 *
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2006, 2007 Zimbra, Inc.
 *
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 *
 * ***** END LICENSE BLOCK *****
 *@Author Raja Rao DV
 */

function com_zimbra_rssexample() {
}
com_zimbra_rssexample.prototype = new ZmZimletBase();
com_zimbra_rssexample.prototype.constructor = com_zimbra_rssexample;

com_zimbra_rssexample._feed = "http://feeds.feedburner.com/uoguelph";


//--------------------------------------
//		CODE THAT FETCHES RSS FEED
//--------------------------------------

com_zimbra_rssexample.prototype._invoke =
function(postCallback) {
	var feedUrl =  ZmZimletBase.PROXY + AjxStringUtil.urlComponentEncode(com_zimbra_rssexample._feed);

	AjxRpc.invoke(null, feedUrl, null, new AjxCallback(this, this._reponseHandler, postCallback), true);
};

com_zimbra_rssexample.prototype._reponseHandler =
function(postCallback, reponse) {
	var items = "";
	try {
		items = reponse.xml.getElementsByTagName("item");
	} catch(e) {//there was some expn getting feed
		this._showErrorMsg(e);
		return;
	}
	this.titleDescArray = new Array();
	this._currentFeedIndex = 0;
	var counter = 0;
	for (var i = 0; i < items.length; i++) {
		try {
			var title = desc = "";
			var titleObj = items[i].getElementsByTagName("title")[0].firstChild;
			var descObj = items[i].getElementsByTagName("description")[0].firstChild;
			var linkObj = items[i].getElementsByTagName("link")[0].firstChild;
			if (titleObj.textContent) {
				this.titleDescArray[counter] = {title: titleObj.textContent, desc:descObj.textContent, link:linkObj.textContent};
			} else if (titleObj.text) {
				this.titleDescArray[counter] =  {title: titleObj.text, desc:descObj.text, link:linkObj.text}; 
			}
			counter++;
		}catch(e) {//print some exception
			this._showErrorMsg(e);
			return;
		}
	}

   if(postCallback)
	   postCallback.run(this);

};

com_zimbra_rssexample.prototype._showErrorMsg =
function(msg) {
	var msgDialog = appCtxt.getMsgDialog();
	msgDialog.reset();
	msgDialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE);
	msgDialog.popup();
};


//--------------------------------------
//		USER INTERACTION HANDLERS
//--------------------------------------
com_zimbra_rssexample.prototype.doubleClicked =
function() {	
	this.singleClicked();
};

com_zimbra_rssexample.prototype.singleClicked =
function() {	
	this.rsseg_showFeedsInMiniCal = this.getUserProperty("rsseg_showFeedsInMiniCal") == "true";
	//if the option was recently changed using pref, use that value
	if(document.getElementById("rsseg_showFeedsInMiniCal") != undefined) {
		this.rsseg_showFeedsInMiniCal = document.getElementById("rsseg_showFeedsInMiniCal").checked;
	}
	
	var postCallback = null;
	if(this.rsseg_showFeedsInMiniCal) {//show in minical..
		if(this._visible) {//if rss feed is visible.. clear timeout, and then swap it
			if(this._timerID){
				clearTimeout(this._timerID);
			}
			this._showRSSInMiniCal();
			return;
		}
		 postCallback = new AjxCallback(this, this._showRSSInMiniCal);
	} else {//show in dialog..
		postCallback = new AjxCallback(this, this._displayRSSResultsDialog);
	}
	this._invoke(postCallback);
};

com_zimbra_rssexample.prototype.menuItemSelected = function(itemId) {
	switch (itemId) {
		case "smseg_preferences":
			this._displayPrefDialog();
			break;
	}
};

//--------------------------------------
//		DIALOG VIEW
//--------------------------------------
com_zimbra_rssexample.prototype._displayRSSResultsDialog =
function() {
	if (this.rssExampleDlg) {
		this._parentView.getHtmlElement().innerHTML = this._constructDialogView();
		this.rssExampleDlg.popup();
		return;
	}
	this._parentView = new DwtComposite(this.getShell());
	this._parentView.setSize("550", "300");
	this._parentView.getHtmlElement().style.overflow = "auto";
	this._parentView.getHtmlElement().innerHTML = this._constructDialogView();
	this.rssExampleDlg = this._createDialog({title:"Gryph News", view:this._parentView, standardButtons : [DwtDialog.OK_BUTTON]});
	this.rssExampleDlg.popup();
};

com_zimbra_rssexample.prototype._constructDialogView =
function() {
	var html = new Array();
	var i = 0;
	for(var j=0;j<this.titleDescArray.length; j++) {
		var val = this.titleDescArray[j];
		html[i++] = "<div class='rsseg_HdrDiv'>";
		html[i++] = "<TABLE  cellpadding=5>";
		html[i++] = "<TR>";
		html[i++] = "<TD>";
		html[i++] =  val.title;
		html[i++] = "</TD>";
		html[i++] = "</TR>";
		html[i++] = "</TABLE>";
		html[i++] = "</div>";
		html[i++] = "<div class='rsseg_sectionDiv'>";
		html[i++] = "<TABLE  cellpadding=5>";
		html[i++] = "<TR>";
		html[i++] = "<TD>";
		html[i++] =  val.desc;
		html[i++] = "</TD>";
		html[i++] = "</TR>";
		html[i++] = "<TR>";
		html[i++] = "<TD>";
		html[i++] =  "<a href='"+val.link+"' target='_blank'>"+val.link+"</a>";
		html[i++] = "</TD>";
		html[i++] = "</TR>";
		html[i++] = "</TABLE>";
		html[i++] = "</div>";		
	}
	return html.join("");
};


//--------------------------------------
//		MINICAL VIEW
//--------------------------------------

com_zimbra_rssexample.prototype._showRSSInMiniCal = function() {
    this._visible = !this._visible;

	if(!this._miniCal) {
		var calController = AjxDispatcher.run("GetCalController");
		this._miniCal = calController ? calController.getMiniCalendar().getHtmlElement() : null;
	}
    if (this._visible) {
        if (!this._newDiv) {
            this._newDiv = document.createElement("div");

            this._newDiv.id = "rssexample_DIV";;
            this._newDiv.style.zIndex = 900;
			this._newDiv.style.width = 163;
            this._newDiv.style.backgroundColor = "white";
            document.getElementById("skin_container_tree_footer").appendChild(this._newDiv);
        }
        // temporarily hide the mini calendar
        this._miniCal.style.visibility = "hidden";
		this._showMinicalView();//call it for the first time
		this._timerID = setInterval(AjxCallback.simpleClosure(this._showMinicalView, this), 2000);
    } else {
        this._miniCal.style.visibility = "visible";
    }
};

com_zimbra_rssexample.prototype._showMinicalView =
function() {
	if(this._currentFeedIndex ==this.titleDescArray.length) {
		this._currentFeedIndex =0;//reset
	}
	var html = new Array();
	var i = 0;
	var val = this.titleDescArray[this._currentFeedIndex];
	html[i++] = "<div>";
	html[i++] = "<TABLE  cellpadding=5>";
	html[i++] = "<TR>";
	html[i++] = "<TD>";
	html[i++] =  val.title;
	html[i++] = "</TD>";
	html[i++] = "</TR>";
	html[i++] = "<TR>";
	html[i++] = "<TD>";
	html[i++] =  "<a href='"+val.link+"' target='_blank'>"+val.link+"</a>";
	html[i++] = "</TD>";
	html[i++] = "</TR>";
	html[i++] = "</TABLE>";
	html[i++] = "</div>";	
	this._newDiv.innerHTML = html.join("");
	this._currentFeedIndex++;
};

//--------------------------------------
//		PROPERTIES DIALOG...
//--------------------------------------

com_zimbra_rssexample.prototype._displayPrefDialog =
function() {
	//if zimlet dialog already exists...
	if (this.pbDialog) {
		this.pbDialog.popup();
		return;
	}
	this.pView = new DwtComposite(this.getShell());
	this.pView.getHtmlElement().innerHTML = this._createPreferenceView();


	//show the checkbox checked if needed
	if (this.getUserProperty("rsseg_showFeedsInMiniCal") == "true") {
		document.getElementById("rsseg_showFeedsInMiniCal").checked = true;
	}


	var readMeButtonId = Dwt.getNextId();
	var readMeButton = new DwtDialog_ButtonDescriptor(readMeButtonId, ("Read Me"), DwtDialog.ALIGN_LEFT);
	this.pbDialog = this._createDialog({title:"Zimlet Preferences", view:this.pView, standardButtons:[DwtDialog.OK_BUTTON],  extraButtons:[readMeButton]});
	this.pbDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okBtnListner));
	this.pbDialog.setButtonListener(readMeButtonId, new AjxListener(this, this._showReadMe));
	this.pbDialog.popup();
};


com_zimbra_rssexample.prototype._createPreferenceView =
function() {
	var html = new Array();
	var i = 0;
	html[i++] = "<DIV>";
	html[i++] = "<input id='rsseg_showFeedsInMiniCal'  type='checkbox'/>Show RSS Feed in minical(and not in dialog)";
	html[i++] = "</DIV>";
	return html.join("");
};


com_zimbra_rssexample.prototype._okBtnListner =
function() {
	if (document.getElementById("rsseg_showFeedsInMiniCal").checked && !this.rsseg_showFeedsInMiniCal
		|| !document.getElementById("rsseg_showFeedsInMiniCal").checked && this.rsseg_showFeedsInMiniCal) {

		this.setUserProperty("rsseg_showFeedsInMiniCal", document.getElementById("rsseg_showFeedsInMiniCal").checked, true);
	} 
	this.pbDialog.popdown();
};