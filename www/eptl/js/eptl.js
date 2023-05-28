/*
eptl.js
Created by Tyler Knox
Copyright 2016-2019 Bella Pizzeria
*/

var eptlVersion = '1.5.3.5';
var eptlUpdated = '08.21.19';
var eptlDebug = false;



/* ========================================================== */
/* =================== GLOBAL VARIABLES ===================== */
/* ========================================================== */
var today = new Date();
var lsKey = today.toDateString();
var appSettings = [];
var appStats = [];
var fsReady = false;
var settingsChanged = false;
var validAdminPass = false;
var checkingForUpdates = false;
var socketConnectedSet = false;
var socketChannelSet = false;
var versionCheckedAndSet = false;
var timeCheck;
var eptlClock;
var clockTaps;
var clockTapTimer;
var userView;
var soundBeep;
var lastItemAdded;
var finishedOpening;
var lastUserAction;
var eptlSocket;





/* ========================================================== */
/* ==================== EVENT HANDLERS ====================== */
/* ========================================================== */


// Top Left Cell - Dropdown Option Selected
$('body').on('click', '#eptl-topLeftCell .dropdown-menu li', function() {
	if($(this).prop('id') === 'eptl-tld-debug') {
		var href = window.location.href;
		window.open(href, '_blank', 'height=600,width=1024');
		return;
	}

	if(!$(this).hasClass('disabled') && !checkingForUpdates) {
		var tpId = $(this).prop('id').split('-')[2];
		var newLeft = '#eptl-leftCol-'+tpId;
		var newContent = '#eptl-contentWrap-'+tpId;
		userView = tpId;

		// Update leftCol
		$(this).parent().children('.disabled').removeClass('disabled');
		$(this).addClass('disabled');
		$('.eptl-leftCol-content').fadeOut(250);
		$(newLeft).fadeIn(750);

		// Update contentWrapper
		$('.eptl-contentWrapper').fadeOut(250);
		$(newContent).fadeIn(750);

		// Update topLeft button
		var tlbLink = $(this).children('a').html();
		var tlbNew = tlbLink.substr(tlbLink.indexOf('&nbsp;')+7);
		$('#topLeftPage').html(tlbNew);

		if(tpId === 'addItems') {
			setupTimeTable();
			lsLoad();
			if($('#eptlClock').css('display')==='none') $('#eptlClock').fadeIn();
		}
		if(tpId === 'viewLogs') initLogView();
		if(tpId === 'settings') {
			$('#eptl-leftCol-settings').children('.eptl-row:first-child').click();
		}

		// Collapse any expanded rows
		$('.eptl-rowExpanded').css('height','100px').removeClass('eptl-rowExpanded').children('h2').children('.glyphicon').removeClass('glyphicon-triangle-right')
		.addClass('glyphicon-triangle-bottom');
		$('.aiExpanded').css('width', '0px').css('padding', '0px').hide().removeClass('aiExpanded');
		$('#eptl-leftCol-pizzaWH').unstick().hide();
		$('#eptl-leftCol-bsQtyWrap').hide();
		setTimeout(caColHeight, 250);

	}

});

// Add Items Category Toggle
$('body').on('click', '#eptl-leftCol-addItems .eptl-row', function(e) {
	var thisIcon = $(this).children('h2').children('.eptl-left-icon');
	if($(thisIcon).hasClass('glyphicon-triangle-bottom')) {
		// Collapse any currently expanded section
		$('.aiExpanded').animate({width: '0px', padding: '0px'}, 250, function() {
			$(this).removeClass('aiExpanded').hide();
		});
		$('.eptl-rowExpanded').animate({height:"100px"},250,function() {
			$('.eptl-col').css('height', 'auto');
			$('#eptl-leftCol-pizzaWH').unstick().hide();
			$('#eptl-leftCol-bsQtyWrap').hide();
		}).removeClass('eptl-rowExpanded').children('h2').children('.glyphicon').removeClass('glyphicon-triangle-right').addClass('glyphicon-triangle-bottom');


		// Expand this section
		function expandThisSection(rowRef) {
			if(!checkingForUpdates) {
				var thisAiCat = $(rowRef).prop('id').split('-')[3];
				var thisAiWrapId = '#eptl-aiWrap-'+thisAiCat;
				var iwHeight = $(rowRef).children('.eptl-leftCol-itemsWrapper').height()
				var itemsHeight = (thisAiCat==='Calzone' ? iwHeight : (thisAiCat==='Pizza' ? iwHeight+130 : iwHeight+170));
				var newHeight = itemsHeight + "px";
				$(thisAiWrapId).show().animate({width: '575px', padding: '10px'}).addClass('aiExpanded');
				$(thisIcon).removeClass('glyphicon-triangle-bottom').addClass('glyphicon-triangle-right');
				$(rowRef).addClass('eptl-rowExpanded').animate({height:'200px'}, 500, function() {
					caColHeight();
					if(thisAiCat==='Pizza') {
						$('#eptl-leftCol-pizzaWH').fadeIn(function() {
							$('#eptl-leftCol-pizzaWH').sticky({zIndex:999});
						});
					}
					if(thisAiCat==='Breadsticks') {
						$('#eptl-leftCol-bsQtyWrap').fadeIn();
					}
				});
			}
		}
		if($('.aiExpanded').length) {
			var rr = this;
			setTimeout(function(){expandThisSection(rr)}, 255);
		} else {
			expandThisSection(this);
		}
	} else {
		// Collapse this section
		if(e.target.classList[0] !== 'btn' &&
		e.target.localName !== 'img' &&
		e.target.parentNode.id !== 'eptl-leftCol-bsQtyWrap' &&
		e.target.parentNode.id !== 'bsQtySlider' &&
		e.target.id !== 'eptl-leftCol-bsQtyWrap' &&
		e.target.className !== 'slider-track-high') {
			console.log(e);
			$(this).animate({height:"100px"}, 500, function() {
				$(this).removeClass('eptl-rowExpanded');
				$('#eptl-leftCol-pizzaWH').unstick().hide();
				$('#eptl-leftCol-bsQtyWrap').hide();
				$(thisIcon).removeClass('glyphicon-triangle-right').addClass('glyphicon-triangle-bottom');
				caColHeight();
			});
			$('.aiExpanded').animate({width: '0px', padding: '0px'}, 500, function() {
				$(this).removeClass('aiExpanded').hide();
			});
		}
	}
});

// PizzaWH selector
$('body').on('click', '#eptl-leftCol-pizzaWH button', function() {
	if(!$(this).hasClass('pizzaWH-selected')) {
		$('#eptl-leftCol-pizzaWH').children('.pizzaWH-selected').removeClass('btn-danger').addClass('btn-default').removeClass('pizzaWH-selected');
		$(this).removeClass('btn-default').addClass('btn-danger').addClass('pizzaWH-selected');
	}

	var whSelected = $('.pizzaWH-selected').prop('id');
	if(whSelected !== 'pizzaWH-whole') {
		$('#eptl-leftCol-items-Pizza').children('.btn').removeAttr('data-toggle').removeAttr('data-target');
	} else {
		$('#eptl-leftCol-items-Pizza').children('.btn').attr('data-toggle', 'modal').attr('data-target', '#dlg-addItems-Pizza');
	}
});

// Add Items - Item Button Clicked
$('body').on('click', '.aiExpanded .btn', function() {
	var itemCat;
	var itemName;

	// Pizza
	if($('#eptl-leftCol-addItems-Pizza').hasClass('eptl-rowExpanded')) {
		if($('#pizzaWH-whole').hasClass('pizzaWH-selected')) {
			// Whole Pizza
			itemCat = $(this).parent().prop('id').split('-')[2];
			itemName = $(this).html().replace('<br>', ' ');
			lsAdd(itemCat, itemName, 1);
		} else {
			// Half & Half Pizza
			if($('#pizzaWH-left').hasClass('pizzaWH-selected')) {
				// User selected left half
				if($(this).html() === 'Stuffed') {
					lsAdd('Pizza', '(&frac12;) Stuffed', 0.5);
					$('#pizzaWH-left').removeClass('btn-danger').removeClass('pizzaWH-selected').addClass('btn-default');
					$('#pizzaWH-whole').removeClass('btn-default').addClass('pizzaWH-selected').addClass('btn-danger');
				} else {
					$('#btnStuffedPizza').prop('disabled', true);
					$('#eptl-pizzaHH-left').val($(this).html().replace('<br>', ' '));
					$('#pizzaWH-left').removeClass('pizzaWH-selected').removeClass('btn-danger').addClass('btn-default').addClass('disabled').attr('disabled', 'true');
					$('#pizzaWH-right').removeClass('btn-default').removeClass('disabled').addClass('btn-danger').addClass('pizzaWH-selected').removeAttr('disabled');
					$('#pizzaWH-whole').addClass('disabled').attr('disabled', 'true');
					$(this).addClass('disabled').attr('disabled', 'true');
				}
			} else if($('#pizzaWH-right').hasClass('pizzaWH-selected')) {
				// Add the 1/2 & 1/2 pizza to the time table
				itemCat = $(this).parent().prop('id').split('-')[2];
				itemName = '(&frac12;) '+$('#eptl-pizzaHH-left').val()+'<br>(&frac12;) '+$(this).html().replace('<br>', ' ');
				lsAdd(itemCat, itemName, 0.5);
				// Reset UI
				$('#pizzaWH-right').removeClass('pizzaWH-selected').removeClass('btn-danger').addClass('btn-default').addClass('disabled').attr('disabled', 'true');
				$('#pizzaWH-left').removeClass('disabled').removeAttr('disabled');
				$('#pizzaWH-whole').removeClass('btn-default').removeClass('disabled').removeAttr('disabled').addClass('btn-danger').addClass('pizzaWH-selected');
				$('#eptl-aiWrap-Pizza').children('.btn').removeClass('disabled').removeAttr('disabled');
			}
		}
	}

	// Calzones
	if($('#eptl-leftCol-addItems-Calzone').hasClass('eptl-rowExpanded')) {
		itemCat = $(this).parent().prop('id').split('-')[2];
		itemName = ($(this).html()==='Ham<br>Cheese' ? 'Ham &amp; Cheese' : $(this).html().replace('<br>', ' '));
		lsAdd(itemCat, itemName, 1);
	}

	// Breadsticks
	if($('#eptl-leftCol-addItems-Breadsticks').hasClass('eptl-rowExpanded')) {
		var itemQty = parseInt($('#eptl-addItems-bsQty').val());
		itemCat = $(this).parent().prop('id').split('-')[2];
		itemName = $(this).html().replace('<br>', ' ');
		lsAdd(itemCat, itemName, itemQty);
	}
});

// Add Items - Item Container Clicked
$('body').on('click', '.eptlAiWrap', function(mEvent) {
	if(mEvent.target.className.indexOf('btn') === -1) {
		$('.aiExpanded').animate({width: '0px', padding: '0px'}, function() {
			$(this).hide().removeClass('aiExpanded');
		});
		$('.eptl-rowExpanded').animate({height:"100px"} ,function() {
			$('.eptl-col').css('height', 'auto');
			$('#eptl-leftCol-pizzaWH').unstick().hide();
			$('#eptl-leftCol-bsQtyWrap').hide();
		}).removeClass('eptl-rowExpanded').children('h2').children('.glyphicon').removeClass('glyphicon-triangle-right').addClass('glyphicon-triangle-bottom');
	}
});

/*
// Add Items - Existing Item clicked
$('body').on('click', '.eptl-list li a', function() {
	if(!$(this).parent().children('input:checkbox').length) {
		$(this).parent().append('<input type="checkbox" checked>');
	} else {
		$(this).parent().children('input:checkbox').remove();
	}
});
*/

// Edit existing list item
$('body').on('click', '.eptl-list li a', function() {
	var eId = $(this).prop('id');
	var eParent = $(this).parent().parent().prop('id');
	var selectedItem = itemLookup(eId);
	var eItem = selectedItem.entryItem;
	var iQty = selectedItem.entryQty;
	var iHour = eId.split('-')[1];
	var iMin = selectedItem.entryMin;
	var iCat = selectedItem.entryCat;
	var iAmPm = ((appSettings.groupItemsBy==='category') ? eParent.split('-')[1] : eParent.substr(eParent.length-2));
	if(iHour > 12) iHour -= 12;
	if(iMin < 10) iMin = '0'+iMin;

	$('#dlg-editItem-callerId').val(eId);
	$('#dlg-editItem-timeHr').val(iHour);
	$('#dlg-editItem-timeMin').val(iMin);
	$('#dlg-editItem-timeAmPm').html(iAmPm);

	if(iQty === 0.5 && eItem !== '(&frac12;) Stuffed') {
		var leftHalf = eItem.substr(11, eItem.indexOf('<br>')-11);
		var rightHalf = eItem.substr(eItem.indexOf('<br>')+15);
		$('#dlg-editItem-qty').val(1).attr('disabled', 'true');
		$('#dlg-editItem-Pizza-hh').show();
		$('#dlg-editItem-Pizza-hhLeft').html(leftHalf+' <span class="caret"></span>');
		$('#dlg-editItem-Pizza-hhRight').html(rightHalf+' <span class="caret"></span>');
		$('#dlg-editItem-title').html('&frac12; &amp; &frac12; Pizza');
	} else {
		$('#dlg-editItem-qty').val(iQty);
		if(eItem==='Panzerotti' || eItem==='Stromboli' || eItem.indexOf('Roll') !== -1) {
			$('#dlg-editItem-title').html(eItem);
		} else {
			$('#dlg-editItem-title').html(eItem+' '+iCat);
		}
		if(eItem === '(&frac12;) Stuffed') {
			$('#dlg-editItem-qty').val('1').attr('disabled', 'true');
		}
	}
});

// Edit Item Dialog - Half & Half Pizza Button Toggle
$('body').on('click', '#dlg-editItem-Pizza-hh .btn', function() {
	var hhl = $('#dlg-editItem-Pizza-hhLeft').html();
	var hhr = $('#dlg-editItem-Pizza-hhRight').html();
	var lh = hhl.substr(0, hhl.indexOf(' <span'));
	var rh = hhr.substr(0, hhr.indexOf(' <span'));
	if($(this).prop('id') === 'dlg-editItem-Pizza-hhRight') {
		$('#hhPizza-dropdown').css('left', '166px');
	} else {
		$('#hhPizza-dropdown').css('left', '0');
	}
	$('#hhPizza-dropdown').empty();
	$('#eptl-aiWrap-Pizza').children('.btn').each(function() {
		var pi = $(this).html();
		if(pi !== lh && pi !== rh && pi !== 'Stuffed') $('#hhPizza-dropdown').append('<li><a href="#">'+pi.replace('<br>', ' ')+'</a></li>');
	});
});

// Edit Item Dialog - Half & Half Pizza Dropdown Item Clicked
$('body').on('click', '#hhPizza-dropdown li a', function() {
	var newSelection = $(this).html();
	var lr = (($('#hhPizza-dropdown').css('left')==='166px') ? 'Right' : 'Left');
	var btnId = '#dlg-editItem-Pizza-hh'+lr;
	$(btnId).html(newSelection+' <span class="caret"></span>');
});

// Edit Item Dialog - Time Toggle (am/pm)
$('body').on('click', '#dlg-editItem-timeAmPm', function() {
	if($(this).html() === 'am') {
		$(this).html('pm');
	} else {
		$(this).html('am');
	}
});

// Edit Item Dialog - Remove Item
$('body').on('click', '#btnEditItem-Remove', function() {
	var rItem = $('#dlg-editItem-callerId').val().split('-');
	lsRemove(rItem[1], rItem[2]);
});

// Edit Item Dialog - Save Changes
$('body').on('click', '#btnEditItem-Save', function() {
	var eiCaller = $('#dlg-editItem-callerId').val();
	var eiCat = eiCaller.split('-')[0];
	var eiQty = parseInt($('#dlg-editItem-qty').val());
	var eiHr = parseInt($('#dlg-editItem-timeHr').val());
	var eiMin = parseInt($('#dlg-editItem-timeMin').val());
	var eiHalves = false;
	var eiNow = new Date();
	if(!eiMin) eiMin = 0;
	if($('#dlg-editItem-Pizza-hh').css('display') === 'block') {
		var lv = $('#dlg-editItem-Pizza-hhLeft').html();
		var rv = $('#dlg-editItem-Pizza-hhRight').html();
		eiHalves = {
			left: lv.substr(0, lv.indexOf(' <span')),
			right: rv.substr(0, rv.indexOf(' <span'))
		};
	}
	if(eiCat === 'Pizza' || eiCat === 'Calzone') {
		if(eiQty > 9 || eiQty < 1 || !eiQty) {
			$('#dlg-editItem-alert').html("You must enter a quantity between 1 and 9!").show().fadeOut(5000);
			return;
		}
	} else {
		if(eiQty < 1 || !eiQty) {
			$('#dlg-editItem-alert').html("You must enter a valid quantity!").show().fadeOut(5000);
			return;
		}
	}
	if(eiHr > 12 || !eiHr) {
		$('#dlg-editItem-alert').html("You must enter an hour between 1 and 12!").show().fadeOut(5000);
		return;
	}
	if(eiHr < 12) {
		if($('#dlg-editItem-timeAmPm').html() === 'pm') {
			var tHour = eiHr + 12;
			if(tHour > 22) {
				$('#dlg-editItem-alert').html("The time you entered is not during business hours!").show().fadeOut(5000);
				return;
			}
		} else {
			if(eiHr < 9) {
				$('#dlg-editItem-alert').html("The time you entered is not during business hours!").show().fadeOut(5000);
				return;
			}
		}
	}
	if(eiMin > 59 || eiMin < 0) {
		$('#dlg-editItem-alert').html("You must enter minutes between 00 and 59!").show().fadeOut(5000);
		return;
	}
	if($('#dlg-editItem-timeAmPm').html() === 'pm') {
		var checkHour = ((eiHr !== 12) ? eiHr+12 : 12);
		if(checkHour > eiNow.getHours()) {
			$('#dlg-editItem-alert').html("You cannot enter a time in the future!").show().fadeOut(5000);
			return;
		}
		if(checkHour === eiNow.getHours() && eiMin > eiNow.getMinutes()) {
			$('#dlg-editItem-alert').html("You cannot enter a time in the future!").show().fadeOut(5000);
			return;
		}
	} else {
		if(eiHr > eiNow.getHours()) {
			$('#dlg-editItem-alert').html("You cannot enter a time in the future!").show().fadeOut(5000);
			return;
		}
		if(eiHr === eiNow.getHours() && eiMin > eiNow.getMinutes()) {
			$('#dlg-editItem-alert').html("You cannot enter a time in the future!").show().fadeOut(5000);
			return;
		}
	}

	lsEdit(eiCaller, eiQty, eiHr, eiMin, eiHalves);
	$('#btnEditItem-Cancel').click();
});

// Edit Item Dialog - Dialog Closed
$('body').on('hidden.bs.modal', '#dlg-editItem', function() {
	$('#dlg-editItem-Pizza-hh').hide();
	$('#dlg-editItem-qty').removeAttr('disabled');
});

// Expired Items Dialog - Dialog Closed
$('body').on('hidden.bs.modal', '#dlg-expiredItems', function() {
	clearInterval(soundBeep);
});

// Opening Alert Dialog - Dialog Closed
$('body').on('hidden.bs.modal', '#dlg-openingAlert', function() {
	clearInterval(soundBeep);
});

// Passcode Prompt - Dialog Closed
$('body').on('hidden.bs.modal', '#dlg-enterPasscode', function() {
	clockTapTimer = null;
	clockTaps = 0;
	$('#eptlAdminPasscode').val('');
});

// Opening Alert Dialog - Finished Opening button clicked
$('body').on('click', '#btnFinishedOpening', function() {
	finishedOpening = true;
	var fodo = new Date();
	var fot = fodo.toDateString()+' @ '+fodo.toTimeString().split(' ')[0];
	appStats.finishedOpening = fot;
	localStorage.setItem('eptlStats', JSON.stringify(appStats));
	refreshStats();
	if(eptlSocket) {
		var sInfo = {
			store: appStats.store,
			stat: 'finishedOpening',
			val: fot
		};
		eptlSocket.emit('updateStat', sInfo);
	}
});

// Number input clicked
$('body').on('click', ':input[type="number"]', function() {
	$(this).select();
});

// Breadsticks quantity changed
$('body').on('change', '#eptl-addItems-bsQty', function() {
	var bsQty = $(this).val();
	if(bsQty === '' || bsQty === '0') $(this).val(appSettings.defaultBsticksQty);
	updateSlider(bsQty);
});

// Settings Category Toggle
$('body').on('click', '#eptl-leftCol-settings .eptl-row', function() {
	if($(this).prop('id') !== 'eptlSettings-saveWrap') {
		if(!$(this).hasClass('eptl-rowSelected')) {
			var newCat = $(this).children('h3').html();
			var newPage = '#eptlContent-settings-'+newCat;

			// Require Passcode for the Advanced tab
			if(newCat==='Advanced' && !validAdminPass) {
				$('#dlg-enterPasscode').modal();
				return;
			}

			// De-select previously chosen category
			$('#eptl-leftCol-settings').children('.eptl-rowSelected').children('h3').children('span').remove();
			$('.eptl-rowSelected').removeClass('eptl-rowSelected');
			$('.eptlSettingsContentWrap').hide();

			// Select newly chosen category
			$(this).addClass('eptl-rowSelected').children('h3').append('<span class="glyphicon glyphicon-star eptl-left-icon" aria-hidden="true"></span>');
			$(newPage).show();
		}
	} else {
		// Save settings
	}
});

// Settings - Version clicked
$('body').on('click', '#eptlVersion', function() {
	if(userView !== 'addItems') {
		$('#eptl-tld-addItems').click();
	} else {
		if($('#eptl-leftCol-addItems').children('.eptl-rowExpanded').length) {
			$('#eptl-leftCol-addItems').children('.eptl-rowExpanded').click();
		}
	}
	setTimeout(eptlCheckForUpdates, 500);
});

// Settings - Group Items Toggle
$('body').on('click', '#eptlSetting-groupItems button', function() {
	if(!$(this).hasClass('btn-info')) {
		var gibSetting = $(this).html();
		$('#eptlSetting-groupItems').children('.btn-info').removeClass('btn-info').addClass('btn-default');
		$(this).removeClass('btn-default').addClass('btn-info');
		if(gibSetting === 'Category') {
			$('.eptlSubSetting-groupItems').fadeOut().parent().animate({height:'67px'});
		} else {
			$('.eptlSubSetting-groupItems').parent().animate({height:'122px'});
			$('.eptlSubSetting-groupItems').fadeIn();
		}
		checkSettings();
	}
});

// Setting clicked
$('body').on('click', '#eptl-contentWrap-settings', function(e) {
	if(e.target.id) {
		if(e.target.id !== 'btnSyncNow' && e.target.id !== 'btnFoldNow' && e.target.id !== 'eptlVersion') {
			// Exclude clicks on the Stats page
			if($('#lbsStats').hasClass('eptl-rowSelected')) {
				return;
			}

			checkSettings();
		}
	}
});

// Setting - Input value changed
$('body').on('change', '.eptlSetting input', function() {
	checkSettings();
});

// Settings - Cancel Changes Button Clicked
$('body').on('click', '#btnCancelSettings', function() {
	$('#eptlSettings-saveWrap').fadeOut();
	$('#topLeft-dropdown').removeAttr('disabled');
	loadSettings();
});

// Settings - Save Settings Button Clicked
$('body').on('click', '#btnSaveSettings', function() {
	$('#eptlSettings-saveWrap').fadeOut();
	$('#topLeft-dropdown').removeAttr('disabled');
	saveSettings();
});

// Log View - Move Left (next date)
$('body').on('click', '#logMoveControlWrap .move-left', function() {
	var selectedDate = new Date($('#logTitle').html());
	var tomorrow = new Date(selectedDate.setDate(selectedDate.getDate() + 1));
	var tParts = tomorrow.toDateString().split(' ');
	var fullMonth = determineMonth(determineMonth(tParts[1], true));
	var monthRowId = '#eptLogs-'+fullMonth+'-'+tParts[3];
	var dateRowTxt = tParts[0]+' '+tParts[1]+' '+(parseInt(tParts[2]) < 10 ? tParts[2].substr(1) : tParts[2]);

	// Handle "today"
	var todayParts = today.toDateString().split(' ');
	if(tParts[0]===todayParts[0] && tParts[1]===todayParts[1] && tParts[2]===todayParts[2] && tParts[3]===todayParts[3]) {
		if($(monthRowId).hasClass('eptl-rowExpanded')) $(monthRowId).click();
		$('#eptl-leftCol-viewLogs').children('.logRowSub:first-child').click();
		$('.move-left').children('h2').hide();
	} else {
		if(!$(monthRowId).hasClass('eptl-rowExpanded')) $(monthRowId).click();
		var monthRows = $(monthRowId).children('.eptl-leftCol-itemsWrapper').children('.logRowSub');
		for(var i=0; i<monthRows.length; i++) {
			var thisRow = monthRows[i];
			if(!$(thisRow).hasClass('logRowSelected')) {
				var thisDate = $(thisRow).html().split(' &nbsp; ')[1];
				if(thisDate === dateRowTxt) {
					$(thisRow).click();
					break;
				}
			}
		}
	}
	$('.move-right').children('h2').show();
});

// Log View - Move Right (previous date)
$('body').on('click', '#logMoveControlWrap .move-right', function() {
	var selectedDate = new Date($('#logTitle').html());
	var yesterday = new Date(selectedDate.setDate(selectedDate.getDate() - 1));
	var yParts = yesterday.toDateString().split(' ');
	var fullMonth = determineMonth(determineMonth(yParts[1], true));
	var monthRowId = '#eptLogs-'+fullMonth+'-'+yParts[3];
	var dateRowTxt = yParts[0]+' '+yParts[1]+' '+(parseInt(yParts[2]) < 10 ? yParts[2].substr(1) : yParts[2]);

	if(!$(monthRowId).hasClass('eptl-rowExpanded')) $(monthRowId).click();

	var monthRows = $(monthRowId).children('.eptl-leftCol-itemsWrapper').children('.logRowSub');
	for(var i=0; i<monthRows.length; i++) {
		var thisRow = monthRows[i];
		if(!$(thisRow).hasClass('logRowSelected')) {
			var thisDate = $(thisRow).html().split(' &nbsp; ')[1];
			if(thisDate === dateRowTxt) {
				$(thisRow).click();
				break;
			}
		}
	}
	$('.move-left').children('h2').show();

	// Handle last date
	var last = $('#eptl-leftCol-viewLogs').children('.logRowMain:last-child').children('.eptl-leftCol-itemsWrapper').children('.logRowSub:last-child');
	if($(last).hasClass('logRowSelected')) $('.move-right').children('h2').hide();

});

// View Logs - Month Row Toggle
$('body').on('click', '#eptl-leftCol-viewLogs .logRowMain', function(e) {
	var thisIcon = $(this).children('h3').children('.eptl-left-icon');
	if($(thisIcon).hasClass('glyphicon-triangle-bottom')) {
		// Collapse any currently expanded section
		$('.eptl-rowExpanded').animate({height:"50px"},250,function(){$('.eptl-col').css('height', 'auto');}).removeClass('eptl-rowExpanded')
			.children('h3').children('.glyphicon').removeClass('glyphicon-triangle-top').addClass('glyphicon-triangle-bottom');

		// Expand this section
		var itemsHeight = $(this).children('.eptl-leftCol-itemsWrapper').height() + 100;
		var newHeight = itemsHeight + "px";
		$(this).animate({height:newHeight}, 500, function() {
			$(this).addClass('eptl-rowExpanded');
			$(thisIcon).removeClass('glyphicon-triangle-bottom').addClass('glyphicon-triangle-top');
		});
	} else {
		// Collapse this section
		var etcn = e.target.className.split(' ');
		if(etcn.indexOf('logRowSub') === -1 && etcn.indexOf('glyphicon-star') === -1 && e.target.parentNode.className.split(' ').indexOf('logRowSelected') === -1) {
			$(this).animate({height:"50px"}, 500, function() {
				$(this).removeClass('eptl-rowExpanded');
				$(thisIcon).removeClass('glyphicon-triangle-top').addClass('glyphicon-triangle-bottom');
			});
		}
	}
});

// View Logs - Date Selected
$('body').on('click', '.logRowSub', function() {
	if(!$(this).hasClass('logRowSelected')) {
		var innerTxt = $('.logRowSelected').children('h3').html();
		innerTxt = innerTxt.substr(0, innerTxt.indexOf('<span'));
		$('.logRowSelected').children('h3').children('span').remove();
		if(innerTxt !== 'Today') $('.logRowSelected').empty().html('<span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span> &nbsp; '+innerTxt);
		$('.logRowSelected').removeClass('logRowSelected');
		if($(this).children('h3').html() !== 'Today') {
			// Selected a date
			var dateSelected = $(this).html().split('&nbsp; ')[1];
			var dateYear = parseInt($(this).parent().parent().prop('id').split('-')[2]);
			$(this).addClass('logRowSelected').html('<h3>'+dateSelected+'<span class="glyphicon glyphicon-star eptl-left-icon" aria-hidden="true"></span></h3>');
			loadLog(dateSelected, dateYear);
			$('.move-left').children('h2').show();
			var last = $('#eptl-leftCol-viewLogs').children('.logRowMain:last-child').children('.eptl-leftCol-itemsWrapper').children('.logRowSub:last-child');
			if($(last).hasClass('logRowSelected')) $('.move-right').children('h2').hide();
		} else {
			// Selected "Today"
			$('#eptl-leftCol-viewLogs').children('.logRowSub:first-child').addClass('logRowSelected').children('h3')
			.append('<span class="glyphicon glyphicon-star eptl-left-icon" aria-hidden="true"></span>');
			loadLog('Today');
			$('.move-left').children('h2').hide();
		}
	}
});

// Settings - Force Sync Now
$('body').on('click', '#btnSyncNow', function() {
	syncData(true);
});

// Settings - Force Overwrite Local Data
$('body').on('click', '#btnFoldNow', forceOverwriteLocalData);

// Passcode Prompt - Fully Shown
$('body').on('shown.bs.modal', '#dlg-enterPasscode', function() {
	$('#eptlAdminPasscode').focus();
});

// Passcode Prompt - Enter pressed
$('body').on('keydown', '#eptlAdminPasscode', function(e) {
	if(e.keyCode===13 || e.keyCode===9) $('#btnCheckPasscode').click();
});

// Passcode Prompt - Continue Button Clicked
$('body').on('click', '#btnCheckPasscode', function() {
	if(checkAdminPasscode() === true) {
		validAdminPass = true;
		$('#dlg-enterPasscode').modal('hide');
		if(clockTapTimer !== 'secret') {
			// Enter advanced settings
			$('#eptl-leftCol-settings').children('.eptl-row:nth-child(4)').click();
		} else {
			// Clock was pressed 5 times -- mute volume
			window.muteVolume(function(result) {
				if(result !== 'volume_muted') {
					alert(result);
				} else {
					alert('Volume muted!');
				}
			});
		}
		validAdminPass = false;
		$('#eptlAdminPasscode').val('');
	} else {
		$('#enterPassResult').html('Invalid Passcode!').show().fadeOut(3000, function() {
			$(this).html('');
		});
	}
});

// Passcode Prompt - Return Key Pressed
$('body').on('keydown', 'input', function(e) {
	if(e.keyCode === 9) {
		if($(e.currentTarget).prop('id') !== 'eptlAdminPasscode') $('#btnEditItem-Save').focus();
	}
});

// Clock - Clicked
$('body').on('click', '#eptlClock', function() {
	if(clockTapTimer === null) {
		clockTapTimer = setTimeout(function() {
			if(clockTaps < 5) {
				clockTaps = 0;
				clockTapTimer = null;
				console.log('tap timer reset');
			}
		}, 1200);
	}
	clockTaps++;
	if(clockTaps >= 5) {
		clockTapTimer = 'secret';
		console.log('entered secret');
		$('#dlg-enterPasscode').modal();
	}
});

// Settings - Alert Volume Toggle
$('body').on('click', '#eptlSetting-alertVolume button', function() {
	if(!$(this).hasClass('btn-info')) {
		var gibSetting = $(this).html();
		$('#eptlSetting-alertVolume').children('.btn-info').removeClass('btn-info').addClass('btn-default');
		$(this).removeClass('btn-default').addClass('btn-info');
		checkSettings();
	}
});

// Settings - Stats Page Opened
$('body').on('click', '#lbsStats', refreshStats);

// Settings - Stats - Refresh Stats button clicked
$('body').on('click', '#btnRefreshStats', refreshStats);

// Settings - Stats - Set Store Link Clicked
$('body').on('click', '.statsSetStore', function() {
	var storeVal = $(this).html();
	var lcStore = storeVal.toLowerCase();
	appStats.store = lcStore;
	localStorage.setItem('eptlStats', JSON.stringify(appStats));
	appSettings.syncPath = appSettings.syncPath + lcStore;
	localStorage.setItem('eptlSettings', JSON.stringify(appSettings));
	$('#statsStore').html(storeVal);
	initSocket();
});

// Any user activity
$('body').on('click', function() {
	lastUserAction = new Date();
	var luaStat = lastUserAction.toDateString()+' @ '+lastUserAction.toTimeString().split(' ')[0];
	appStats.lastUserAction = luaStat;
	localStorage.setItem('eptlStats', JSON.stringify(appStats));
	refreshStats();
	if(eptlSocket && socketChannelSet) {
		var statInfo = {
			store: appStats.store,
			stat: 'lastUserAction',
			val: luaStat
		}
		eptlSocket.emit('updateStat', statInfo);
	}
});




/* ========================================================== */
/* ====================== FUNCTIONS ========================= */
/* ========================================================== */


/* Set the current time blocks and corresponding colors */
function setupTimeTable() {
	var now = new Date();
	var currentHour = now.getHours();
	var displayHour = currentHour;
	if(currentHour > 12) displayHour = currentHour - 12;
	var HourBlock3 = ((displayHour-1 <= 0) ? displayHour-1+12 : displayHour-1);
	var HourBlock2 = ((HourBlock3-1 <= 0) ? displayHour-2+12 : HourBlock3-1);
	var HourBlock1 = ((HourBlock2-1 <= 0) ? displayHour-3+12 : HourBlock2-1);

	//if(parseInt(HourBlock3) === 0) HourBlock3 = 12;

	// Current hour block is always the right-most
	$('#eptl-col-4').css('background-color', hourColor(currentHour)).children('.eptl-row').children('h2').html((displayHour===0 ? '12' : displayHour)+':00 - '+((displayHour===12) ? '1' : displayHour+1)+':00');
	$('#eptl-col-3').css('background-color', hourColor(HourBlock3)).children('.eptl-row').children('h2').html(HourBlock3+':00 - '+(displayHour===0 ? '12' : displayHour)+':00');
	$('#eptl-col-2').css('background-color', hourColor(HourBlock2)).children('.eptl-row').children('h2').html(HourBlock2+':00 - '+HourBlock3+':00');
	$('#eptl-col-1').css('background-color', hourColor(HourBlock1)).children('.eptl-row').children('h2').html(HourBlock1+':00 - '+HourBlock2+':00');

	// Fix the midnight display

	// Load data from localStorage
	lsLoad();
}

/* Set the log time blocks background color */
function setupLogTable() {
	$('.logCol').each(function() {
		var logHr = parseInt($(this).prop('id').split('-')[1]);
		var bgColor = hourColor(logHr);
		$(this).children('.logTimeRow').css('backgroundColor', bgColor);
	});
}

/* Determine the column background color based on the hour block */
function hourColor(hrNum) {
	var hrColor = '#FFF';
	if(hrNum===2 || hrNum===6 || hrNum===10 || hrNum===14 || hrNum===18 || hrNum===22) hrColor = '#00CA59';
	if(hrNum===3 || hrNum===7 || hrNum===11 || hrNum===15 || hrNum===19 || hrNum===23) hrColor = '#FE4245';
	if(hrNum===4 || hrNum===8 || hrNum===12 || hrNum===16 || hrNum===20 || hrNum===0) hrColor = '#FFAF00';
	if(hrNum===5 || hrNum===9 || hrNum===13 || hrNum===17 || hrNum===21 || hrNum===1) hrColor = '#0070FF';
	return hrColor;
}

/* Initialize the localStorage array for today's date */
function lsInit() {
	today = new Date();
	lsKey = today.toDateString();
	finishedOpening = false;
	var lsTemplate = {
		'hourBlock09': [],
		'hourBlock10': [],
		'hourBlock11': [],
		'hourBlock12': [],
		'hourBlock13': [],
		'hourBlock14': [],
		'hourBlock15': [],
		'hourBlock16': [],
		'hourBlock17': [],
		'hourBlock18': [],
		'hourBlock19': [],
		'hourBlock20': [],
		'hourBlock21': [],
		'hourBlock22': []
	};

	var strJson = JSON.stringify(lsTemplate);
	localStorage.setItem(lsKey, strJson);
	lsCleanup();

	// Hide any open modals from previous day
	$('#dlg-expiredItems').modal('hide');
	$('#dlg-openingAlert').modal('hide');
}

/* Load data from the localStorage array */
function lsLoad() {
	var lsData = jQuery.parseJSON(localStorage.getItem(lsKey));
	var lsld = new Date();
	var ldhb = lsld.getHours();
	var ttCol = 4;
	for(var i=ldhb;i>=ldhb-3;i--) {
		var displayCol = '#eptl-colData-'+ttCol;
		var lsBlock = ((i===9) ? 'hourBlock09' : 'hourBlock'+i);
		var defined = [];
		var nd = 0;
		var toAppend = [];
		$(displayCol).html('');
		if(lsData[lsBlock]) lsData[lsBlock].forEach(displayItems);
		ttCol--;
	}

	function displayItems(dItem, dIndex) {
		var displayHour = ((i > 12) ? i-12 : i);
		var ampm = ((i < 12) ? 'am' : 'pm');
		var teMin = ((parseInt(dItem.entryMin) < 10) ? '0'+dItem.entryMin : dItem.entryMin);
		var teQty = dItem.entryQty;
		var teItem = dItem.entryItem;
		var teCat = dItem.entryCat;
		var aid = teCat+'-'+(i===9 ? '09' : i)+'-'+dIndex;
		var output = '<li><a id="'+aid+'" data-toggle="modal" data-target="#dlg-editItem">'+((teQty===0.5) ? teItem : '('+teQty+') '+teItem);
		var listId;
		if(appSettings.groupItemsBy === 'time') {
			if(teCat !== 'Pizza' && teItem !== 'Panzerotti' && teItem !== 'Stromboli' && teItem !== 'Garlic Knots' && teItem.indexOf('Roll') === -1) {
				output += ' '+teCat;
			}
			listId = ((appSettings.qTimeBlocks==='false') ? displayHour+':'+teMin+ampm : quarterBlock(displayHour, teMin, ampm));
		} else {
			listId = displayHour+'-'+ampm+'-'+teCat;
		}
		output += '</a></li>';
		if(defined.indexOf(listId) === -1) {
			var listDisplay;
			if(appSettings.groupItemsBy === 'time') {
				listDisplay = listId;
			} else {
				var plural = listId.substr(listId.length-1);
				var listName = listId.split('-')[2];
				listDisplay = ((plural==='s') ? listName : listName+'s');
			}
			defined[nd] = listId;
			if(appSettings.newItemsTop === 'true') {
				$(displayCol).prepend('<span id="aiListWrap-'+i+'-'+nd+'"><strong>'+listDisplay+'</strong></span>');
			} else {
				$(displayCol).append('<strong>'+listDisplay+'</strong>');
			}
			var list = document.createElement('ul');
			$(list).addClass('eptl-list').prop('id', listId).append(output);
			toAppend[nd] = list;
			if(appSettings.newItemsTop === 'true') {
				var listHeader = '#aiListWrap-'+i+'-'+nd;
				$(list).insertAfter(listHeader);
			} else {
				$(list).appendTo(displayCol);
			}
			nd++;
		} else {
			var di = defined.indexOf(listId);
			if(appSettings.newItemsTop === 'true') {
				$(toAppend[di]).prepend(output);
			} else {
				$(toAppend[di]).append(output);
			}
		}

		if(appSettings.showOutTime === 'true' && appSettings.groupItemsBy === 'category') {
			var outElem = document.createElement('span');
			var outTime = displayHour + 4;
			var outPlacement = '#'+aid;
			if(outTime > 12) outTime = outTime - 12;
			outTime += ':'+teMin+'pm';
			$(outElem).addClass('outTime').html(outTime);
			if($(outPlacement).width() > 118) {
				var itemHeight = $(outPlacement).parent().height()+25+'px';
				$('<br>').insertAfter(outPlacement);
				$(outPlacement).parent().css('height', itemHeight);
			}
			if($(outPlacement).parent().children('br').length === 0) {
				$(outElem).insertAfter(outPlacement);
			} else {
				$(outElem).insertAfter($(outPlacement).parent().children('br'));
			}
		}
	}

	function displayOutTime() {
		$(document).ready(function() {
			$('.eptlColData').each(function() {
				var cdWrap = (($(this).children('span').length < 1) ? $(this).children('strong') : $(this).children('span').children('strong'));
				$(cdWrap).each(function() {
					var thisRef = $(this);
					var strSplit = $(this).html().split(':');
					var sHr = parseInt(strSplit[0]) + 4;
					var outHr = ((sHr > 12) ? sHr-12 : sHr);
					var sMin = strSplit[1].substr(0, strSplit[1].length-2);
					var outElem = document.createElement('span');
					var outHtml = outHr+':'+sMin+'pm';
					$(outElem).addClass('outTime').html(outHtml).insertAfter(thisRef);
				});
			});
		});
	}

	function quarterBlock(hrs, mins, ap) {
		var minBlock = '00';
		var iMins = parseInt(mins);
		if(iMins >= 15 && iMins <= 29) minBlock = '15';
		if(iMins >= 30 && iMins <= 44) minBlock = '30';
		if(iMins >= 45 && iMins <= 59) minBlock = '45';
		var newBlock = hrs+':'+minBlock+ap;
		return newBlock;
	}

	function addList(alElems, alCol, alList) {
		$(alElems).each(function() {
			if($(this).prop('id') === alList) {
				if(appSettings.newItemsTop === 'true') {
					$(alCol).prepend(this).prepend('<strong>'+alList+'</strong>');
				} else {
					$(alCol).append('<strong>'+alList+'</strong>').append(this);
				}
			}
		});
	}

	// Sort lists by time (when applicable)
	if(appSettings.groupItemsBy==='time') {
		$('.eptlColData').each(function() {
			var sortLists = [];
			var listElems = [];
			if($(this).children('.eptl-list').length > 1) {
				$(this).children('.eptl-list').each(function() {
					sortLists.push($(this).prop('id'));
					listElems.push(this);
				});
				$(this).empty();
				sortLists.sort();
				for(var l=0;l<sortLists.length;l++) {
					var thisCol = this;
					var thisList = sortLists[l];
					addList(listElems, thisCol, thisList);
				}
			}
		});
		if(appSettings.showOutTime === 'true') displayOutTime();
	}

	// Format the list items to be evenly spaced and fixed height
	$('.eptl-list').each(function() {
		var firstChild = $(this).children('li:first').children('a').height();
		if(firstChild > 20) $(this).children('li:first').css('marginTop', '15px');
		$(this).children('li').each(function() {
			var innerHeight = $(this).children('a').height();
			if(innerHeight === 20) $(this).css('paddingTop', '15px');
		});
	});

	// Check & adjust column height
	caColHeight();
}

/* Add entry to the localStorage array */
function lsAdd(iCat, iName, iQty) {
	var lsData = jQuery.parseJSON(localStorage.getItem(lsKey));
	var lsad = new Date();
	var lsMin = lsad.getMinutes();
	var hrBlock = lsad.getHours();
	if(hrBlock===9) hrBlock = '09';
	var lsBlock = 'hourBlock'+hrBlock;

	// Ensure that we are within business hours
	if(hrBlock < 9 || hrBlock > 21) {
		alert('You can only add items to the log between the hours of 9am and 9pm!');
		return;
	}

	// Update quantity if item already exists for this hour/minute, otherwise create new entry
	var itemExists = false;
	if(lsData[lsBlock].length > 0) {
		for(var i=0;i<lsData[lsBlock].length;i++) {
			var thisItem = lsData[lsBlock][i];
			if(thisItem.entryMin === lsMin && thisItem.entryCat === iCat && thisItem.entryItem === iName) {
				itemExists = true;
				thisItem.entryQty += iQty;
				break;
			}
		}
	}
	if(!itemExists) {
		var newEntry = {
			entryMin: lsMin,
			entryCat: iCat,
			entryItem: iName	,
			entryQty: iQty
		};
		lsData[lsBlock].push(newEntry);
	}

	var lsJson = JSON.stringify(lsData);
	localStorage.setItem(lsKey, lsJson);
	lsLoad();
	notifyItemAdded(iCat, iName, iQty);
	lastItemAdded = lsad;
	appStats.lastItemAdded = lastItemAdded;
	localStorage.setItem('eptlStats', JSON.stringify(appStats));
	refreshStats();
}

/* Edit entry within the localStorage array */
function lsEdit(lseCaller, lseQty, lseHr, lseMin, lseHalves) {
	var lsData = jQuery.parseJSON(localStorage.getItem(lsKey));
	var lsid = lseCaller.split('-');
	var lsoh = parseInt(lsid[1]);
	var lsix = parseInt(lsid[2]);
	var lshb = 'hourBlock'+(lsoh===9 ? '09' : lsid[1]);

	// Get existing item data
	var existingItem = lsData[lshb][lsix];
	if(lseHr < 12) {
		if($('#dlg-editItem-timeAmPm').html() === 'pm') lseHr += 12;
	}

	// Update quantity
	if(parseInt(existingItem.entryQty) !== lseQty && existingItem.entryQty !== 0.5) existingItem.entryQty = lseQty;

	// Update minutes
	if(parseInt(existingItem.entryMin) !== lseMin) existingItem.entryMin = lseMin;

	// Update halves
	if(lseHalves) existingItem.entryItem = '(&frac12;) '+lseHalves.left+'<br>(&frac12;) '+lseHalves.right;

	// Save changes
	if(lseHr !== lsoh) {
		var newHb = 'hourBlock'+((lseHr < 10) ? '0'+lseHr : lseHr);
		lsData[newHb].push(existingItem);
		lsData[lshb].splice(lsix, 1);
	} else {
		lsData[lshb][lsix] = existingItem;
	}
	localStorage.setItem(lsKey, JSON.stringify(lsData));
	lsLoad();
}

/* Remove entry from the localStorage array */
function lsRemove(rHour, rIndex) {
	var lsData = jQuery.parseJSON(localStorage.getItem(lsKey));
	var lshb = 'hourBlock'+rHour;
	var lsri = parseInt(rIndex);
	lsData[lshb].splice(lsri, 1);

	var lsJson = JSON.stringify(lsData);
	localStorage.setItem(lsKey, lsJson);
	lsLoad();
}

/* Cleanup old entries from the localStorage  */
function lsCleanup() {
	var validEntries = ['eptlSettings', today.toDateString()];
	var numDays = parseInt(appSettings.daysLocalData);
	var startCount = today.getTime();
	for(var d=1;d<=numDays;d++) {
		var backCount = 86400000 * d;
		var pastTime = startCount - backCount;
		var pastDay = new Date(pastTime);
		validEntries.push(pastDay.toDateString());
	}
	for(var k=0;k<localStorage.length;k++) {
		var thisKey = localStorage.key(k);
		if(validEntries.indexOf(thisKey) === -1) {
			localStorage.removeItem(thisKey);
		}
	}
}

/* Show notification to the user when item is added */
function notifyItemAdded(nCat, nName, nQty) {
	var mQty = ((nQty !== 0.5) ? '('+nQty.toString()+')' : '');
	var mName = '<strong>'+nName+'';
	if (nName.indexOf('<br>') !== -1) {
		var ph = nName.split('<br>');
		mName = ph[0].substr(0,10)+'<strong>'+ph[0].substr(10)+'</strong> &amp; '+ph[1].substr(0,10)+'<strong>'+ph[1].substr(10);
	}
	var msg = 'Added '+mQty+' '+mName;
	if(nName !== 'Panzerotti' && nName !== 'Stromboli' && nName !== 'Garlic Knots' && nName.indexOf('Roll') === -1) {
		msg	+= ' '+nCat+'</strong>.';
	} else {
		msg += '</strong>.';
	}

	// Shift any existing notifications up
	$('#addItemsNotificationsWrapper').children('.alert').each(function() {
		var cssBottom = $(this).css('bottom');
		var pxBottom = parseInt(cssBottom.substr(0, cssBottom.indexOf('px'))) + 72;
		var bottom = pxBottom+'px';
		if(pxBottom > 78) {
			$(this).remove();
		} else {
			$(this).css('bottom', bottom);
		}
	});

	// Display the notification
	var alertElem = document.createElement('div');
	$(alertElem).addClass('alert').html(msg).css('bottom','0px').appendTo('#addItemsNotificationsWrapper');

	// Automatically fade out after 4 seconds
	setTimeout(function() {
		if($(alertElem).length) {
			$(alertElem).fadeOut(function() {
				$(alertElem).remove();
			});
		}
	}, 4000);
}

/* Check & adjust column height */
function caColHeight(specHeight) {
	$('.eptl-col').css('height', 'auto').css('minHeight', '600px');
	if(!specHeight) {
		var tallestCol = 600;
		$('.eptl-col').each(function() {
			var thisHeight = $(this).height();
			if(thisHeight > tallestCol) tallestCol = thisHeight;
		});
		if(tallestCol > 600) {
			var newHeight = tallestCol+60+'px';
			$('.eptl-col').css('minHeight', newHeight);
		} else {
			$('.eptl-col').css('minHeight', '600px');
		}
	} else {
		var nsHeight = ((specHeight.indexOf('px') !== -1) ? specHeight : specHeight+'px');
		$('.eptl-col').css('minHeight', nsHeight);
	}
}

/* Lookup Item */
function itemLookup(itemId) {
	var iData = itemId.split('-');
	var iHour = iData[1];
	var iIndex = parseInt(iData[2]);
	var lsData = jQuery.parseJSON(localStorage.getItem(lsKey));
	var lshb = 'hourBlock'+(parseInt(iData[1])===9 ? '09' : iHour);
	var theItem = lsData[lshb][iIndex];
	return theItem;
}

/* Initialize app settings */
function initSettings() {
	var eptlSettings = {
		groupItemsBy: 'time',
		newItemsTop: 'true',
		showOutTime: 'true',
		qTimeBlocks: 'true',
		alertExpiredItems: 'true',
		defaultBsticksQty: 24,
		daysLocalData: 30,
		syncPath: 'server.thebellapizza.com/eptl/sync.php?store=',
		syncTime: '23:55',
		alertVolume: 'yes',
		version: eptlVersion
	};
	var lsSettings = JSON.stringify(eptlSettings);
	localStorage.setItem('eptlSettings', lsSettings);
}

/* Load app settings */
function loadSettings() {
	var lsSettings = localStorage.getItem('eptlSettings');
	appSettings = jQuery.parseJSON(lsSettings);
	if(!appSettings.hasOwnProperty('version')) {
		appSettings.version = eptlVersion;
	} else {
		checkEptlVersion();
	}

	// Update UI
	if(appSettings.groupItemsBy === 'time') {
		$('#eptlSetting-groupItems').children('button:first-child').removeClass('btn-default').addClass('btn-info');
		if($('#eptlSetting-groupItems').children('button:last-child').hasClass('btn-info')) {
			$('#eptlSetting-groupItems').children('button:last-child').removeClass('btn-info').addClass('btn-default');
		}
		$('.eptlSubSetting-groupItems').show().parent().css('height', 'auto');
	} else {
		$('#eptlSetting-groupItems').children('button:last-child').removeClass('btn-default').addClass('btn-info');
		if($('#eptlSetting-groupItems').children('button:first-child').hasClass('btn-info')) {
			$('#eptlSetting-groupItems').children('button:first-child').removeClass('btn-info').addClass('btn-default');
		}
		$('.eptlSubSetting-groupItems').hide().parent().css('height', 'auto');
	}
	if(appSettings.qTimeBlocks === 'true') {
		$('#eptlSetting-qTimeBlocks').prop('checked', 'checked');
	} else {
		$('#eptlSetting-qTimeBlocks').removeProp('checked');
	}
	if(appSettings.newItemsTop === 'true') {
		$('#eptlSetting-newItemsTop').prop('checked', 'checked');
	} else {
		$('#eptlSetting-newItemsTop').removeProp('checked');
	}
	if(appSettings.showOutTime === 'true') {
		$('#eptlSetting-showOutTime').prop('checked', 'checked');
	} else {
		$('#eptlSetting-showOutTime').removeProp('checked');
	}
	if(appSettings.alertExpiredItems === 'true') {
		$('#eptlSetting-alertExpiredItems').prop('checked', 'checked');
	} else {
		$('#eptlSetting-alertExpiredItems').removeProp('checked');
	}

	$('#eptlSetting-defaultBsticksQty').val(appSettings.defaultBsticksQty);
	$('#eptl-addItems-bsQty').val(appSettings.defaultBsticksQty);

	$('#eptlSetting-daysLocalData').val(appSettings.daysLocalData);

	$('#eptlSetting-syncPath').val(appSettings.syncPath);

	var splitSync = appSettings.syncTime.split(':');
	$('#syncTimeHour').val(splitSync[0]);
	$('#syncTimeMins').val(splitSync[1]);

	$('#lastSyncTime').html(appStats.lastSync);

	// Alerts Override Volume
	var alertVolume_yBtn = $('#eptlSetting-alertVolume').children('button:first-child');
	var alertVolume_nBtn = $('#eptlSetting-alertVolume').children('button:last-child');
	if(appSettings.alertVolume === 'yes') {
		if($(alertVolume_yBtn).hasClass('btn-default')) $(alertVolume_yBtn).removeClass('btn-default');
		if(!$(alertVolume_yBtn).hasClass('btn-info')) $(alertVolume_yBtn).addClass('btn-info');
		if($(alertVolume_nBtn).hasClass('btn-info')) $(alertVolume_nBtn).removeClass('btn-info');
		if(!$(alertVolume_nBtn).hasClass('btn-default')) $(alertVolume_nBtn).addClass('btn-default');
	} else {
		if($(alertVolume_nBtn).hasClass('btn-default')) $(alertVolume_nBtn).removeClass('btn-default');
		if(!$(alertVolume_nBtn).hasClass('btn-info')) $(alertVolume_nBtn).addClass('btn-info');
		if($(alertVolume_yBtn).hasClass('btn-info')) $(alertVolume_yBtn).removeClass('btn-info');
		if(!$(alertVolume_yBtn).hasClass('btn-default')) $(alertVolume_yBtn).addClass('btn-default');
	}
}

/* Check app settings */
function checkSettings() {
	settingsChanged = false;
	var val_groupItemsBy = $('#eptlSetting-groupItems').children('.btn-info').html().toLowerCase();
	var val_newItemsTop = (document.getElementById('eptlSetting-newItemsTop').checked ? "true" : "false");
	var val_showOutTime = (document.getElementById('eptlSetting-showOutTime').checked ? "true" : "false");
	var val_qTimeBlocks = (document.getElementById('eptlSetting-qTimeBlocks').checked ? "true" : "false");
	var val_alertExpired = (document.getElementById('eptlSetting-alertExpiredItems').checked ? "true" : "false");
	var val_defaultBsticksQty = $('#eptlSetting-defaultBsticksQty').val();
	var val_daysLocalData = $('#eptlSetting-daysLocalData').val();
	var val_syncPath = $('#eptlSetting-syncPath').val();
	var val_syncTime = $('#syncTimeHour').val()+':'+$('#syncTimeMins').val();
	var val_alertVolume = $('#eptlSetting-alertVolume').children('.btn-info').html().toLowerCase();
	var userSettings = {
		groupItemsBy: val_groupItemsBy,
		newItemsTop: val_newItemsTop,
		showOutTime: val_showOutTime,
		qTimeBlocks: val_qTimeBlocks,
		alertExpiredItems: val_alertExpired,
		defaultBsticksQty: val_defaultBsticksQty,
		daysLocalData: val_daysLocalData,
		syncPath: val_syncPath,
		syncTime: val_syncTime,
		alertVolume: val_alertVolume,
		version: eptlVersion
	};
	var aProps = Object.getOwnPropertyNames(appSettings);
	for(var i=0;i<aProps.length;i++) {
		var propName = aProps[i];
		if(appSettings[propName] !== userSettings[propName]) {
			settingsChanged = true;
		}
	}

	// Show the "Save Settings" button when necessary
	if(settingsChanged) {
			$('#eptlSettings-saveWrap').fadeIn();
			$('#topLeft-dropdown').prop('disabled', 'disabled');
	} else {
		if($('#eptlSettings-saveWrap').css('display') !== 'none') {
			$('#eptlSettings-saveWrap').fadeOut();
		}
		$('#topLeft-dropdown').removeAttr('disabled');
	}
}

/* Save app settings */
function saveSettings() {
	var val_groupItemsBy = $('#eptlSetting-groupItems').children('.btn-info').html().toLowerCase();
	var val_newItemsTop = (document.getElementById('eptlSetting-newItemsTop').checked ? "true" : "false");
	var val_showOutTime = (document.getElementById('eptlSetting-showOutTime').checked ? "true" : "false");
	var val_qTimeBlocks = (document.getElementById('eptlSetting-qTimeBlocks').checked ? "true" : "false");
	var val_alertExpired = (document.getElementById('eptlSetting-alertExpiredItems').checked ? "true" : "false");
	var val_defaultBsticksQty = $('#eptlSetting-defaultBsticksQty').val();
	var val_daysLocalData = $('#eptlSetting-daysLocalData').val();
	var val_syncPath = $('#eptlSetting-syncPath').val();
	var val_syncTime = $('#syncTimeHour').val()+':'+$('#syncTimeMins').val();
	var val_alertVolume = $('#eptlSetting-alertVolume').children('.btn-info').html().toLowerCase();
	var newSettings = {
		groupItemsBy: val_groupItemsBy,
		newItemsTop: val_newItemsTop,
		showOutTime: val_showOutTime,
		qTimeBlocks: val_qTimeBlocks,
		alertExpiredItems: val_alertExpired,
		defaultBsticksQty: val_defaultBsticksQty,
		daysLocalData: val_daysLocalData,
		syncPath: val_syncPath,
		syncTime: val_syncTime,
		alertVolume: val_alertVolume,
		version: eptlVersion
	};
	localStorage.setItem('eptlSettings', JSON.stringify(newSettings));
	loadSettings();
	updateSlider(val_defaultBsticksQty);
	initSocket();
}

/* Initialize app stats */
function initStats() {
	var d = new Date();
	var rs = d.toDateString()+' @ '+d.toTimeString().split(' ')[0];
	var si = appSettings.syncPath.indexOf('store=') + 6;
	var iss = appSettings.syncPath.substr(si);
	var ss = (iss === '' ? statsStoreNotSet() : iss);
	var sfo = (finishedOpening === true ? 'Yes' : 'No');
	if(localStorage.getItem('eptlStats') === null) {
		var eptlStats = {
			store: ss,
			finishedOpening: sfo,
			lastSync: 'Never',
			lastFold: 'Never',
			lastUpdated: 'Never',
			lastCfu: 'Never',
			lastUserAction: 'null',
			lastItemAdded: 'null',
			runningSince: rs,
			apkVersion: '1.5'
		};
		var lsStats = JSON.stringify(eptlStats);
		localStorage.setItem('eptlStats', lsStats);
		appStats = eptlStats;
	} else {
		appStats = JSON.parse(localStorage.getItem('eptlStats'));
		appStats.store = ss;
		appStats.finishedOpening = sfo;
		appStats.runningSince = rs;
		if(!appStats.hasOwnProperty('lastItemAdded')) appStats.lastItemAdded = 'null';
		localStorage.setItem('eptlStats', JSON.stringify(appStats));
	}
	getLastUpdatedTime();
}

/* Load app stats */
function refreshStats() {
	var wsStatus = 'Not Connected';
	if(eptlSocket) {
		if(eptlSocket.connected) {
			wsStatus = 'Connected';
			if(socketConnectedSet === false) {
				eptlSocket.emit('getConnectedTime');
				socketConnectedSet = true;
			}
		} else {
			$('#statsWsConnectedSince').html('');
		}
	}

	$('#statsVersion').html(eptlVersion);
	$('#statsStore').html(appStats.store);
	$('#statsFinishedOpening').html(appStats.finishedOpening);
	$('#statsLastItemAdded').html(appStats.lastItemAdded);
	$('#statsLastSync').html(appStats.lastSync);
	$('#statsLastFold').html(appStats.lastFold);
	$('#statsLastUpdated').html(appStats.lastUpdated);
	$('#statsLastCfu').html(appStats.lastCfu);
	$('#statsLastUserAction').html(appStats.lastUserAction);
	$('#statsRunningSince').html(appStats.runningSince);
	$('#statsWsStatus').html(wsStatus);
}



/* Get last updated time */
function getLastUpdatedTime() {
	if(fsReady) {


		window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
			// Make sure we are on the correct version
			console.log('Checking last updated version...');
			dirEntry.getFile('lastUpdatedVersion.txt', {create: false, exclusive: false}, function(luvEntry) {
				luvEntry.file(function (luvFile) {
					var luvReader = new FileReader();
					luvReader.onloadend = function() {
						console.log("Last updated version: " + this.result);
						if(this.result !== eptlVersion) {
							// We are NOT on the correct version
							console.log('Current version: '+eptlVersion);
							console.log('Version mismatch! Will now rebuild LastUpdated files.');
							createLastUpdatedFiles();
						} else {
							// We are on the correct version. Get last updated time
							console.log('Checking last updated time...');
							dirEntry.getFile('lastUpdatedTime.txt', {create: false, exclusive: false}, function(fileEntry) {
								fileEntry.file(function (file) {
									var reader = new FileReader();
									reader.onloadend = function() {
										console.log("Last updated: " + this.result);
										appStats.lastUpdated = this.result;
										localStorage.setItem('eptlStats', JSON.stringify(appStats));
										refreshStats();
									}
									reader.readAsText(file);
								}, function() {
									console.log('ERROR: Failed to read LastUpdated file (time)');
								});
							}, function() {
								console.log('ERROR: Failed to open LastUpdated file (time)');
								createLastUpdatedFiles();
							});
						}
					}
					luvReader.readAsText(luvFile);
				}, function() {
					console.log('ERROR: Failed to read LastUpdated file (version)');
				});
			}, function() {
				console.log('ERROR: Failed to open LastUpdated file (version)');
				createLastUpdatedFiles();
			});
		}, function() {
			console.log('ERROR: Failed to resolve data directory');
		});
	} else {
		console.log('[getLastUpdatedTime] File system not ready! Retrying in 1 second');
		setTimeout(getLastUpdatedTime, 1000);
	}
}

/* Display options for setting store value */
function statsStoreNotSet() {
	var rStr = 'NOT SET &nbsp; &nbsp; ';
	rStr += '<span class="statsSetStore">Office</span> &nbsp; &nbsp; ';
	rStr += '<span class="statsSetStore">HTC</span> &nbsp; &nbsp; ';
	rStr += '<span class="statsSetStore">CT</span> &nbsp; &nbsp; ';
	rStr += '<span class="statsSetStore">Keystone</span>';
	return rStr;
}

function createLastUpdatedFiles() {
	console.log('Creating LastUpdated files...');
	window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
		// Create lastUpdatedVersion
		dirEntry.getFile('lastUpdatedVersion.txt', {create: true, exclusive: false}, function(createLuvEntry) {
			createLuvEntry.createWriter(function (fileWriter) {
				fileWriter.onwriteend = function() {
					console.log("LastUpdated version file created successfully!");
					appSettings.version = eptlVersion;
					localStorage.setItem('eptlSettings', JSON.stringify(appSettings));
					if(eptlSocket) {
						var pushSettings = {
							store: appStats.store,
							settings: appSettings,
							f: 'versionUpdated'
						};
						eptlSocket.emit('postSettings', pushSettings);
					}
				};
				fileWriter.onerror = function (e) {
					console.log("ERROR: Failed file write: " + e.toString());
				};
				var dataObj = new Blob([eptlVersion], { type: 'text/plain' });
				fileWriter.write(dataObj);
			});
		}, function() {
			console.log('ERROR: Failed to create lastUpdated file (version)');
		});

		// Create lastUpdatedTime
		dirEntry.getFile('lastUpdatedTime.txt', {create: true, exclusive: false}, function(createLutEntry) {
			createLutEntry.createWriter(function (fileWriter) {
				var d = new Date();
				var lu = d.toDateString()+' @ '+d.toTimeString().split(' ')[0];
				fileWriter.onwriteend = function() {
					console.log("LastUpdated time file created successfully!");
					appStats.lastUpdated = lu;
					localStorage.setItem('eptlStats', JSON.stringify(appStats));
					refreshStats();

					// [1.5.2] Remove lastSync property from appSettings
					if(appSettings.hasOwnProperty('lastSync')) {
						delete appSettings.lastSync;
						localStorage.setItem('eptlSettings', JSON.stringify(appSettings));
					}

					// [1.5.3] Remove webSocket property from appStats
					if(appStats.hasOwnProperty('webSocket')) {
						delete appStats.webSocket;
						localStorage.setItem('eptlStats', JSON.stringify(appStats));
					}

					// [1.5.3] Remove luaTime property from appStats
					if(appStats.hasOwnProperty('luaTime')) {
						delete appStats.luaTime;
						localStorage.setItem('eptlStats', JSON.stringify(appStats));
					}

					if(eptlSocket) {
						var rss = appSettings.syncPath.indexOf('store=') + 6;
						var rsStore = appSettings.syncPath.substr(rss);
						if(rsStore !== '') {
							var usInfo = {
								store: rsStore,
								stat: 'lastUpdated',
								val: lu
							}
							eptlSocket.emit('updateStat', usInfo);

						}
					}
				};
				fileWriter.onerror = function (e) {
					console.log("ERROR: Failed file write: " + e.toString());
				};
				var dataObj = new Blob([lu], { type: 'text/plain' });
				fileWriter.write(dataObj);
			});
		}, function() {
			console.log('ERROR: Failed to create lastUpdated file (time)');
		});
	}, function() {
		console.log('ERROR: Failed to resolve data directory');
	});
}

/* Update breadsticks quantity slider value and position */
function updateSlider(num) {
	$('#eptl-addItems-bsQtySlider').slider("setValue", num);
}

/* Initialze Log View */
function initLogView() {
	$('#logTitle').html(logTitle());
	$('#eptl-contentWrap-viewLogs').scrollLeft(0);

	// Setup the leftCol
	var lcra = 1;
	var currentMonth = today.getMonth();
	var lcnt = new Date();
	var numMonthsToList = 10;
	var mtlDate;
	var mtlMonth;
	$('#eptl-leftCol-viewLogs').empty();
	logLeftCol('Today', true, true);
	if(today.getDate() > 1) {
		logLeftCol(determineMonth(currentMonth)+' '+today.getFullYear(), true, false);
		lcra++;
	}
	mtlDate = new Date(lcnt.setMonth(lcnt.getMonth() - numMonthsToList));
	mtlMonth = mtlDate.getMonth();
	for(var tym=currentMonth-1; tym>=0; tym--) {
		if(lcra <= numMonthsToList) {
			logLeftCol(determineMonth(tym)+' '+today.getFullYear(), true, false);
			lcra++;
		} else {
			break;
		}
	}
	if(lcra < numMonthsToList) {
		for(var lym=11; lym>=mtlMonth; lym--) {
			if(lcra <= numMonthsToList) {
				logLeftCol(determineMonth(lym)+' '+mtlDate.getFullYear(), true, false);
				lcra++;
			} else {
				break;
			}
		}
	}

	$('.logRowMain').each(function() {
		var thisMain = $(this).prop('id');
		var rowYear = parseInt($(this).children('h3').html().split(' ')[1]);
		var rowMonth = thisMain.split('-')[1].substr(0, 3);
		var monthDays = new Date(rowYear, determineMonth(rowMonth), 0).getDate();
		populateMain(thisMain, rowMonth, monthDays, rowYear);
	});
	loadLog('Today');

	function populateMain(mainId, shortMonth, numDays, year) {
		var mainRow = '#'+mainId;
		var itemsWrap = document.createElement('div');
		$(itemsWrap).addClass('eptl-leftCol-itemsWrapper');
		for(var d=numDays; d >= 1; d--) {
			var thisDate = new Date(year, determineMonth(shortMonth)-1, d);
			if(thisDate.getMonth() !== today.getMonth() || thisDate.getMonth() === today.getMonth() && thisDate.getDate() < today.getDate()) {
				var thisDay = determineDay(thisDate.getDay(), true);
				var thisTitle = thisDay+' '+shortMonth+' '+d;
				$(itemsWrap).append('<div class="row eptl-row logRowSub"><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span> &nbsp; '+thisTitle+'</div>');
			}
		}
		$(mainRow).append(itemsWrap);
	}

	function logLeftCol(content, isMain, isSelected) {
		var rowOut = document.createElement('div');
		var rowTxt = document.createElement('h3');
		$(rowTxt).html(content);
		if(isSelected) {
			$(rowTxt).append('<span class="glyphicon glyphicon-star eptl-left-icon" aria-hidden="true"></span>');
			$(rowOut).addClass('logRowSub').addClass('logRowSelected');
		} else {
			if(isMain) {
				$(rowOut).addClass('logRowMain').prop('id', 'eptLogs-'+content.replace(' ', '-'));
				$(rowTxt).append('<span class="glyphicon glyphicon-triangle-bottom eptl-left-icon" aria-hidden="true"></span>');
			} else {
				$(rowOut).addClass('logRowSub');
			}
		}
		$(rowOut).addClass('row').addClass('eptl-row').append(rowTxt).appendTo('#eptl-leftCol-viewLogs');
	}
}

/* Get the log title */
function logTitle(logDate) {
	if(!logDate) logDate = today;
	var ldDay = determineDay(logDate.getDay());
	var ldMonth = determineMonth(logDate.getMonth());
	var ldDate = logDate.getDate();
	var ldYear = logDate.getFullYear();
	var displayTitle = ldDay+', '+ldMonth+' '+ldDate+', '+ldYear;
	return displayTitle;
}

/* Determine human-readable month */
function determineMonth(eptlMonth, bShort) {
	var dMonth;
	if(parseInt(eptlMonth) || eptlMonth===0) {
		switch(eptlMonth) {
			case 0:
				dMonth = 'January';
				break;
			case 1:
				dMonth = 'February';
				break;
			case 2:
				dMonth = 'March';
				break;
			case 3:
				dMonth = 'April';
				break;
			case 4:
				dMonth = 'May';
				break;
			case 5:
				dMonth = 'June';
				break;
			case 6:
				dMonth = 'July';
				break;
			case 7:
				dMonth = 'August';
				break;
			case 8:
				dMonth = 'September';
				break;
			case 9:
				dMonth = 'October';
				break;
			case 10:
				dMonth = 'November';
				break;
			case 11:
				dMonth = 'December';
				break;
		}
		if(bShort) dMonth = dMonth.substr(0, 3);
	} else {
		switch(eptlMonth) {
			case 'Jan':
				dMonth = ((bShort) ? 0 : 1);
				break;
			case 'Feb':
				dMonth = ((bShort) ? 1 : 2);
				break;
			case 'Mar':
				dMonth = ((bShort) ? 2 : 3);
				break;
			case 'Apr':
				dMonth = ((bShort) ? 3 : 4);
				break;
			case 'May':
				dMonth = ((bShort) ? 4 : 5);
				break;
			case 'Jun':
				dMonth = ((bShort) ? 5 : 6);
				break;
			case 'Jul':
				dMonth = ((bShort) ? 6 : 7);
				break;
			case 'Aug':
				dMonth = ((bShort) ? 7 : 8);
				break;
			case 'Sep':
				dMonth = ((bShort) ? 8 : 9);
				break;
			case 'Oct':
				dMonth = ((bShort) ? 9 : 10);
				break;
			case 'Nov':
				dMonth = ((bShort) ? 10 : 11);
				break;
			case 'Dec':
				dMonth = ((bShort) ? 11 : 12);
				break;
		}
	}
	return dMonth;
}

/* Determine human-readable day of the week */
function determineDay(eptlDay, bShort) {
	var dDay;
	switch(eptlDay) {
		case 0:
			dDay = 'Sunday';
			break;
		case 1:
			dDay = 'Monday';
			break;
		case 2:
			dDay = 'Tuesday';
			break;
		case 3:
			dDay = 'Wednesday';
			break;
		case 4:
			dDay = 'Thursday';
			break;
		case 5:
			dDay = 'Friday';
			break;
		case 6:
			dDay = 'Saturday';
			break;
	}
	if(bShort) dDay = dDay.substr(0, 3);
	return dDay;
}

/* Load Log View Data */
function loadLog(viewLogDate, ldYear) {
	var ldObj;
	var lsLogKey;
	if(viewLogDate !== 'Today') {
		var ldSplit = viewLogDate.split(' ');
		var ldMonth = determineMonth(ldSplit[1], true);
		var ldDate = parseInt(ldSplit[2]);
		ldObj = new Date(ldYear, ldMonth, ldDate);
	} else {
		ldObj = today;
	}
	lsLogKey = ldObj.toDateString();

	// Reset scroll
	$('#logWrapper').css('width', '768px');
	$('#eptl-contentWrap-viewLogs').scrollTop(0).scrollLeft(0);

	// Set the log title
	$('#logTitle').html(logTitle(ldObj));

	// Show loading dialog
	if($('#blankLogOverlay').length) $('#blankLogOverlay').remove();
	if($('#logLoadingOverlay').length) $('#logLoadingOverlay').remove();
	var logLoading = document.createElement('div');
	$(logLoading).prop('id', 'logLoadingOverlay').html('<div class="eptl-loading"></div><h2>Loading...</h2>').insertBefore('#logCol-itemName');
	$('.logCol').hide();

	// Load the log data
	setTimeout(function() {
		if(lsHasData()) {
			var lsLogData = jQuery.parseJSON(localStorage.getItem(lsLogKey));
			parseLogData(lsLogData);
		} else {
			rsHasData();
		}
	}, 250);

	function lsHasData() {
		// Try to load log data from localStorage
		var hasData = false;
		if(localStorage.getItem(lsLogKey) !== null) {
			var lsData = jQuery.parseJSON(localStorage.getItem(lsLogKey));
			// Iterate through each hourBlock
			for(var hb=9;hb<=21;hb++) {
				var hbId = ((hb<10) ? '09' : hb.toString());
				var lsdKey = 'hourBlock'+hbId;
				if(lsData[lsdKey].length > 0) {
					hasData = true;
					break;
				}
			}
		}
		return hasData;
	}

	function rsHasData() {
		// Make sure syncPath has store set before attempting remote fetch
		var rss = appSettings.syncPath.indexOf('store=') + 6;
		var rsStore = appSettings.syncPath.substr(rss);
		if(rsStore === '') {
			noLogData('Store is not set!');
			return;
		}

		// No local log data could be found, so request it from the server
		var hasData = false;
		$.ajax({
			type: "POST",
			url: 'https://'+appSettings.syncPath + '&a=rd',
			data: { key: lsLogKey },
			success: function(result) {
				if(result === 'no data') {
					noLogData();
				} else if(result.substr(0,5) === 'error') {
					console.log(result.substr(7));
					noLogData('An unexpected error occurred!');
				} else if(result.trim() === 'Store not recognized!') {
					noLogData('Store not recognized!');
				} else {
					console.log("Retrieved data from server");
					// Iterate through each hourBlock
					var rsData = jQuery.parseJSON(result);
					for(var hb=9;hb<=21;hb++) {
						var hbId = ((hb<10) ? '09' : hb.toString());
						var rsdKey = 'hourBlock'+hbId;
						if(rsData[rsdKey].length > 0) {
							hasData = true;
							break;
						}
					}
					if(hasData) {
						parseLogData(rsData);
						// Cache remote data
						localStorage.setItem(lsLogKey, result);
					} else {
						noLogData();
					}
				}
			}
		});
	}

	function parseLogData(logData) {
		var logItems = [];
		var logCats = [];
		for(var h=9;h<=21;h++) {
			var hb = ((h<10) ? '09' : h.toString());
			var lslHb = 'hourBlock'+hb;
			var hbData = logData[lslHb];
			if(hbData.length > 0) {
				for(var i=0;i<hbData.length;i++) {
					var thisItem = hbData[i].entryItem;
					var itemCat = hbData[i].entryCat;
					var itemLogged = false;
					if(thisItem.substr(0,10) === '(&frac12;)') {
						// Check for 2 items
						if(thisItem.indexOf('<br>') !== -1) {
							// 2 items
							var twoItems = thisItem.split('<br>');
							var item1 = twoItems[0].substr(11);
							var item2 = twoItems[1].substr(11);
							if(logItems.indexOf(item1) === -1) {
								logItems.push(item1);
								logCats.push(itemCat);
							} else {
								for(var i1i=0;i1i<logItems.length;i1i++) {
									if(logItems[i1i] === item1) {
										if(logCats[i1i] === itemCat) {
											itemLogged = true;
											break;
										}
									}
								}
								if(!itemLogged) {
									logItems.push(item1);
									logCats.push(itemCat);
								}
							}
							if(logItems.indexOf(item2) === -1) {
								logItems.push(item2);
								logCats.push(itemCat);
							} else {
								for(var i2i=0;i2i<logItems.length;i2i++) {
									if(logItems[i2i] === item2) {
										if(logCats[i2i] === itemCat) {
											itemLogged = true;
											break;
										}
									}
								}
								if(!itemLogged) {
									logItems.push(item2);
									logCats.push(itemCat);
								}
							}
						} else {
							// 1 item (probably stuffed)
							var halfItem = thisItem.substr(11);
							if(logItems.indexOf(halfItem) === -1) {
								logItems.push(halfItem);
								logCats.push(itemCat);
							} else {
								for(var hi=0;hi<logItems.length;hi++) {
									if(logItems[hi] === halfItem) {
										if(logCats[hi] === itemCat) {
											itemLogged = true;
											break;
										}
									}
								}
								if(!itemLogged) {
									logItems.push(halfItem);
									logCats.push(itemCat);
								}
							}
						}
					} else {
						// Not a half & half pizza
						if(logItems.indexOf(thisItem) === -1) {
							logItems.push(thisItem);
							logCats.push(itemCat);
						} else {
							for(var li=0;li<logItems.length;li++) {
								if(logItems[li] === thisItem) {
									if(logCats[li] === itemCat) {
										itemLogged = true;
										break;
									}
								}
							}
							if(!itemLogged) {
								logItems.push(thisItem);
								logCats.push(itemCat);
							}
						}
					}
				}
			}
		}
		displayLogData(logData, logItems, logCats);
	}

	function displayLogData(logData, logItems, logCats) {
		$('.logColWrap').empty();
		for(var li=0;li<logItems.length;li++) {
			var thisLogItem = ((logItems[li].indexOf(' ')===-1) ? logItems[li] : logItems[li].split(' ')[0]);
			var logItemRow = document.createElement('div');
			var listWrap = '#logColWrap-'+logCats[li];
			var itemElemId = 'logItem'+li.toString();
			if(thisLogItem==='Pep' && logCats[li]==='Breadsticks') thisLogItem = 'Romano';
			if(thisLogItem==='Meat' && logCats[li]==='Pizza') thisLogItem = 'M. Lovers';
			if(thisLogItem==='Garlic' && logCats[li]==='Breadsticks') thisLogItem = 'G. Knots';
			if(logItems[li]==='Pep Sausage' && logCats[li]==='Pizza') thisLogItem = 'Pep/Sausage';
			if(logItems[li]==='Pepperoni Sausage' && logCats[li]==='Pizza') thisLogItem = 'Pep/Sausage';
			if(logItems[li]==='Pepperoni Mushroom' && logCats[li]==='Pizza') thisLogItem = 'Pep/Mush';
			if(logItems[li]==='Sausage Mushroom' && logCats[li]==='Pizza') thisLogItem = '<span style="font-size:0.85em">Sausage/Mush</span>';
			$(logItemRow).addClass('row').prop('id', itemElemId).html(thisLogItem).appendTo(listWrap);
			for(var lc=9;lc<=21;lc++) {
				var lcElem = '#logCol-'+lc.toString();
				var lcCat = '.lcWrap-'+logCats[li];
				var lcItem = document.createElement('div');
				var lcHb = ((lc<10) ? '09' : lc.toString());
				var lcfHb = 'hourBlock'+lcHb;
				var lcHbObj = logData[lcfHb];
				var lcQty = 0;
				if(lcHbObj.length > 0) {
					for(var hbi=0;hbi<lcHbObj.length;hbi++) {
						var hbItemName = lcHbObj[hbi].entryItem;
						var hbItemCat = lcHbObj[hbi].entryCat;
						if(hbItemName.substr(0,10) === '(&frac12;)') {
							if(hbItemName.indexOf('<br>') !== -1) {
								// 2 items
								var lcTwoItems = hbItemName.split('<br>');
								var lcItem1 = lcTwoItems[0].substr(11);
								var lcItem2 = lcTwoItems[1].substr(11);
								if(lcItem1===logItems[li] && hbItemCat===logCats[li] || lcItem2===logItems[li] && hbItemCat===logCats[li]) {
									lcQty += 0.5;
								}
							} else {
								var lcHalfItem = hbItemName.substr(11);
								if(lcHalfItem === logItems[li] && hbItemCat === logCats[li]) {
									lcQty += 0.5;
								}
							}
						} else {
							// Not a half & half
							if(hbItemName === logItems[li] && hbItemCat === logCats[li]) {
								lcQty += lcHbObj[hbi].entryQty;
							}
						}
					}
				}
				var lcItemQty = ((lcQty===0) ? '&nbsp;' : lcQty);
				var strItemQty = lcItemQty.toString();
				if(strItemQty.indexOf('.5') !== -1) lcItemQty = ((parseInt(strItemQty.split('.')[0])===0) ? '&frac12;' : strItemQty.split('.')[0]+' &frac12;');
				$(lcItem).addClass('row').addClass(itemElemId).html(lcItemQty);
				$(lcElem).children(lcCat).append(lcItem);
			}
		}

		// Hide overlay(s) and show log columns
		if($('#blankLogOverlay').length) $('#blankLogOverlay').remove();
		if($('#logLoadingOverlay').length) $('#logLoadingOverlay').remove();
		$('.logCol').show();

		// Hide category row if no items exist
		if(!$('#logColWrap-Calzone').children().length) {
			$('#logColWrap-Calzone').hide();
			$('#lcwCalzones').hide();
			$('.lcWrap-Calzone').hide().prev().hide();
		} else {
			$('#logColWrap-Calzone').show();
			$('#lcwCalzones').show();
			$('.lcWrap-Calzone').show().prev().show();
		}
		if(!$('#logColWrap-Breadsticks').children().length) {
			$('#logColWrap-Breadsticks').hide();
			$('#lcwBreadsticks').hide();
			$('.lcWrap-Breadsticks').hide().prev().hide();
		} else {
			$('#logColWrap-Breadsticks').show();
			$('#lcwBreadsticks').show();
			$('.lcWrap-Breadsticks').show().prev().show();
		}

		// Set the wrapper height
		var numItems = 0;
		var wrapHeight = 0;
		$('#logCol-itemName').children('.logColWrap').each(function(){ numItems += $(this).children().length; });
		numItems += 2;
		wrapHeight = numItems * 22 + 150;
		if(wrapHeight > 600) {
			$('#logWrapper').css('minHeight', wrapHeight+'px').css('width', '995px');
			//$('#eptl-leftCol').css('minHeight', wrapHeight+'px');
		} else {
			$('#logWrapper').css('minHeight', '600px').css('width', '995px');
			//$('#eptl-leftCol').css('minHeight', '600px');
		}
	}

	function noLogData(msg) {
		// No data exists for the selected date
		if($('#logLoadingOverlay').length) $('#logLoadingOverlay').remove();
		if(!$('#blankLogOverlay').length) {
			var overlay = document.createElement('div');
			$(overlay).prop('id', 'blankLogOverlay').insertBefore('#logCol-itemName');
		}
		if(msg) {
			$('#blankLogOverlay').html(msg);
		} else {
			$('#blankLogOverlay').html('No data exists for the selected date!');
		}
		$('.logCol').hide();
	}
}

/* Update the clock on the "Add Items" page */
function updateTime() {
	var currentTime = new Date();
	var ctAmPm = 'am';
	var ctHour = currentTime.getHours();
	var ctMins = currentTime.getMinutes();
	var ctSecs = currentTime.getSeconds();
	if(ctHour >= 12) ctAmPm = 'pm';
	if(ctHour > 12) ctHour -= 12;
	if(ctMins < 10) ctMins = '0'+ctMins;
	if(ctSecs < 10) ctSecs = '0'+ctSecs;
	$('#eptlClock').children('.eptlTime').html(ctHour+':'+ctMins+':'+ctSecs+' '+ctAmPm);
	$('#eptlClock').children('.eptlDate').html(logTitle(currentTime));
}

/* Check to see if any added items have expired */
function checkExpiredItems() {
	var checkTime = new Date();
	var checkHour = checkTime.getHours() - 4;
	if(checkHour >= 9 && checkHour <= 21) {
		// Check to see which items were made 4 hours ago
		var checkHb	= ((checkHour===9) ? 'hourBlock09' : 'hourBlock'+checkHour);
		var checkMins = checkTime.getMinutes();
		var lsData = jQuery.parseJSON(localStorage.getItem(lsKey));
		var checkData = lsData[checkHb];
		if(checkData.length > 0) {
			var possiblyExpired = [];
			var peCats = [];
			var peQtys = [];
			for(var c=0;c<checkData.length;c++) {
				var checkItem = checkData[c].entryItem;
				var itemMin = parseInt(checkData[c].entryMin);
				if(itemMin === checkMins) {
					var itemCat = checkData[c].entryCat;
					var itemQty = checkData[c].entryQty;
					if(checkItem.substr(0,10) === '(&frac12;)') {
						if(checkItem.indexOf('<br>') !== -1) {
							var twoItems = checkItem.split('<br>');
							var item1 = twoItems[0].substr(11);
							var item2 = twoItems[1].substr(11);
							possiblyExpired.push(item1);
							peCats.push(itemCat);
							peQtys.push(itemQty);
							possiblyExpired.push(item2);
							peCats.push(itemCat);
							peQtys.push(itemQty);
						} else {
							var halfItem = checkItem.substr(11);
							possiblyExpired.push(halfItem);
							peCats.push(itemCat);
							peQtys.push(itemQty);
						}
					} else {
						possiblyExpired.push(checkItem);
						peCats.push(itemCat);
						peQtys.push(itemQty);
					}
				}
			}

			// Check the 4 hour blocks in between to see if the possibly expired items have already been replaced
			if(possiblyExpired.length > 0) {
				for(var i=1;i<=4;i++) {
					var ibi = checkHour + i;
					var ibcIndex = 'hourBlock'+ibi;
					var ibCheck = lsData[ibcIndex];
					for(var ib=0;ib<ibCheck.length;ib++) {
						var thisIbItem = ibCheck[ib].entryItem;
						if(thisIbItem.substr(0,10) === '(&frac12;)') {
							if(thisIbItem.indexOf('<br>') !== -1) {
								var ib2items = thisIbItem.split('<br>');
								var ibItem1 = ib2items[0].substr(11);
								var ibItem2 = ib2items[1].substr(11);
								var pei1 = possiblyExpired.indexOf(ibItem1);
								var pei2 = possiblyExpired.indexOf(ibItem2);
								if(pei1 !== -1) {
									possiblyExpired.splice(pei1, 1);
									peCats.splice(pei1, 1);
									peQtys.splice(pei1, 1);
								}
								if(pei2 !== -1) {
									possiblyExpired.splice(pei2, 1);
									peCats.splice(pei2, 1);
									peQtys.splice(pei2, 1);
								}
							} else {
								var ibHalfItem = thisIbItem.substr(11);
								var peih = possiblyExpired.indexOf(ibHalfItem);
								if(peih !== -1) {
									possiblyExpired.splice(peih, 1);
									peCats.splice(peih, 1);
									peQtys.splice(peih, 1);
								}
							}
						} else {
							var pei = possiblyExpired.indexOf(thisIbItem);
							if(pei !== -1) {
								possiblyExpired.splice(pei, 1);
								peCats.splice(pei, 1);
								peQtys.splice(pei, 1);
							}
						}
					}
				}
			}

			// Alert for any remaining (expired) items
			if(possiblyExpired.length > 0) {
				var modalIsOpen = (($('#dlg-expiredItems').css('display') !== 'none') ? true : false);
				if(!modalIsOpen) $('#expiredItemsList').empty();
				for(var e=0;e<possiblyExpired.length;e++) {
					var eItem = possiblyExpired[e];
					var eiQty = peQtys[e];
					var eiCat = ((peCats[e] !== 'Breadsticks' && eiQty > 1) ? peCats[e]+'s' : peCats[e]);
					var eiOutput = '<li>';
					if(eiQty > 1) eiOutput += '('+eiQty+') ';
					if(eItem !== 'Panzerotti' && eItem !== 'Stromboli' && eItem.indexOf('Roll') === -1) {
						eiOutput += eItem+' '+eiCat;
					} else {
						if(eiQty > 1) eItem += 's';
						eiOutput += eItem;
					}
					$('#expiredItemsList').append(eiOutput);
				}
				if(!modalIsOpen) {
					if(appSettings.alertVolume==='yes') maxVolume();
					$('#dlg-expiredItems').modal();
					soundBeep = setInterval(function() {
						document.getElementById('soundPlayer').play();
					}, 3000);
				}
			}
		}
	}
}

/* Alert pizzaman during opening hours (10am - 12pm) after 5 minutes of inactivity */
function alertDuringOpen() {
	var nowTime = new Date();
	if(!finishedOpening && (nowTime.getTime() >= lastItemAdded.getTime()+300000)) {
		var modalIsOpen = (($('#dlg-openingAlert').css('display') !== 'none') ? true : false);
		if(!modalIsOpen) {
			if(appSettings.alertVolume==='yes') maxVolume();
			$('#dlg-openingAlert').modal();
			soundBeep = setInterval(function() {
				document.getElementById('soundPlayer').play();
			}, 3000);
		}
	}
}

/* Set the device volume to maximum */
function maxVolume() {
	window.setMaxVolume(function(result) {
		if(result !== 'max_volume') alert(result);
	});
}

/* Get APK version number */
function apkVersion() {
	console.log('Checking APK version...');
	window.getApkVersion(function(result) {
		if(result === 'NameNotFoundException' || result === 'getApkVersion: something is fucked.') {
			console.log('* ERROR: Failed to get APK version ('+result+')');
			appStats.apkVersion = '1.5';
		} else {
			console.log('* APK Version: '+result);
			appStats.apkVersion = result;
			localStorage.setItem('eptlStats', JSON.stringify(appStats));
			$('#statsApkVersion').html(result);
		}
	});
}

$('body').on('click', '#btnTestSomething', apkVersion);

/* Sync localStorage data with corporate office at the time specified in Settings */
function syncData(overrideNow) {
	var syncTime = appSettings.syncTime.split(':');
	var timeNow = new Date();
	var syncNow = ((timeNow.getHours() === parseInt(syncTime[0]) && timeNow.getMinutes() === parseInt(syncTime[1])) ? true : false);
	if(syncNow || overrideNow) {
		// Prepare the data to sync
		var dataKeys = [];
		var dataVals = [];
		for(var k=0;k<localStorage.length;k++) {
			var thisKey = localStorage.key(k);
			if(thisKey !== "eptlSettings") dataKeys.push(thisKey);
		}
		for(var d=0;d<dataKeys.length;d++) {
			var thisVal = localStorage.getItem(dataKeys[d]);
			dataVals.push(thisVal);
		}

		// Send the data to the server
		var jsonKeys = JSON.stringify(dataKeys);
		var jsonVals = JSON.stringify(dataVals);
		$.ajax({
			type: "POST",
      crossDomain: true,
			url: 'https://'+appSettings.syncPath,
			data: {
				keys: jsonKeys,
				vals: jsonVals
			},
			success: function(result) {
				if(result==='success') {
					// Update "last sync time"
					var lastSyncTime = timeNow.toDateString()+' @ '+timeNow.getHours()+":"+timeNow.getMinutes();
					$('#lastSyncTime').html(lastSyncTime);
					appStats.lastSync = lastSyncTime;
					localStorage.setItem('eptlStats', JSON.stringify(appStats));
					refreshStats();
					if(eptlSocket) {
						var si = appSettings.syncPath.indexOf('store=') + 6;
						var pss = appSettings.syncPath.substr(si);
						var pushSettings = {
							store: pss,
							settings: appSettings,
							f: 'syncData'
						};
						eptlSocket.emit('postSettings', pushSettings);
						var pushStat = {
							store: pss,
							stat: 'lastSync',
							val: lastSyncTime
						};
						eptlSocket.emit('updateStat', pushStat);
					}
				} else {
					console.log(result);
				}
			}
		});
	}
}

/* Check if the user-entered admin passcode is correct */
function checkAdminPasscode() {
	if($('#eptlAdminPasscode').val() === '9684') {
		return true;
	} else {
		return false;
	}
}

/* Show default layout when app is idle */
function checkUserIdle(nowTime) {
	if(nowTime.getTime() >= lastUserAction.getTime()+300000) {
		console.log('app is idle');
		if(userView !== 'addItems') {
			$('#eptl-tld-addItems').click();
		} else {
			if($('#eptl-leftCol-addItems').children('.eptl-rowExpanded').length) {
				$('#eptl-leftCol-addItems').children('.eptl-rowExpanded').click();
			}
		}
	}
}

/* Handle device ready */
function onDeviceReady() {
	// Define EPTL-cordova methods
	window.echo = function(str, callback) {
    cordova.exec(callback, function(err) {
        callback('Nothing to echo.');
    }, "EptlTippy", "echo", [str]);
	};

	window.muteVolume = function(callback) {
		cordova.exec(callback, function(err) {
			callback('muteVolume: something is fucked.');
		}, "EptlTippy", "voldown", []);
	};

	window.setMaxVolume = function(callback) {
		cordova.exec(callback, function(err) {
			callback('maxVolume: something is fucked.');
		}, "EptlTippy", "maxvol", []);
	};

	window.getApkVersion = function(callback) {
		cordova.exec(callback, function(err) {
			callback('getApkVersion: something is fucked.');
		}, "EptlTippy", "versionNumber", []);
	}

	apkVersion();
	fsReady = true;
}

/* Handle device app pause */
function onDevicePause() {
	clearInterval(soundBeep);
	console.log('device paused');
}

/* Handle device app resume */
function onDeviceResume() {
	console.log('device resume');
	var expiredModalIsOpen = (($('#dlg-expiredItems').css('display') !== 'none') ? true : false);
	var oaModalIsOpen = (($('#dlg-openingAlert').css('display') !== 'none') ? true : false);
	if(expiredModalIsOpen || oaModalIsOpen) {
		if(appSettings.alertVolume==='yes') maxVolume();
		document.getElementById('soundPlayer').play();
		soundBeep = setInterval(function() {
			document.getElementById('soundPlayer').play();
		}, 3000);
	}

	if(userView === 'addItems') {
		setupTimeTable();
		lsLoad();
	}
	if(userView === 'viewLogs') {
		initLogView();
	}
}

/* Handle device volume_down button pressed */
function onVolumeDownButtonPressed() {
	console.log('volume down pressed');
}

/* Initialize RC web socket */
function initSocket() {
	var ioStore = appSettings.syncPath.indexOf('store=');
	var channel = appSettings.syncPath.substr(ioStore+6);
	if(channel !== '') {
		console.log('channel = '+channel);
	} else {
		channel = false;
		console.log('no channel');
	}

	if(channel) {
		appStats.store = channel;
		localStorage.setItem('eptlStats', JSON.stringify(appStats));
		if(!eptlSocket) {
			//eptlSocket = io('http://localhost:3000');
			eptlSocket = io('https://server.thebellapizza.com:3785');

			eptlSocket.on('getChannel', function() {
				eptlSocket.emit('setChannel', channel);
				eptlSocket.emit('getConnectedTime');
				socketConnectedSet = true;
				socketChannelSet = true;
			});

			eptlSocket.on('getSettings', function(me) {
				var response = {
					store: me,
					settings: appSettings,
					f: false
				};
				eptlSocket.emit('postSettings', response);
			});

			eptlSocket.on('getLocalData', function() {
				var ldr = [];
				var lsKeys = Object.keys(localStorage);
				for(var i=0; i<lsKeys.length; i++) {
					var lsk = lsKeys[i];
					if(lsk !== 'eptlSettings') {
						var lsv = localStorage.getItem(lsk);
						var ldo = {
							k: lsk,
							v: lsv
						};
						ldr.push(ldo);
					}
				}
				eptlSocket.emit('postLocalData', ldr);
			});

			eptlSocket.on('forceOverwriteLocalData', function() {
				forceOverwriteLocalData();
			});

			eptlSocket.on('checkUpdates', function() {
				eptlCheckForUpdates();
			});

			eptlSocket.on('cbConnectedTime', function(cTime) {
				$('#statsWsStatus').html('Connected');
				$('#statsWsConnectedSince').html(' &nbsp; (since '+cTime+')');
			});

			eptlSocket.on('reconnecting', function() {
				socketChannelSet = false;
				socketConnectedSet = false;
				refreshStats();
			});
		} else {
			var pushSettings = {
				store: channel,
				settings: appSettings,
				f: 'initSocket'
			};
			eptlSocket.emit('postSettings', pushSettings);
		}
	}
}

/* Force overwrite local data */
function forceOverwriteLocalData(wsc) {
	var dld = parseInt(appSettings.daysLocalData);
	var dn = new Date();
	var dub = new Date();
	var dlb = new Date();
	dlb.setDate(dub.getDate()-dld);
	var dubMonth = dub.getMonth() + 1;
	if(dubMonth < 10) dubMonth = '0'+dubMonth;
	var dubDay = dub.getDate() - 1;
	if(dubDay < 10) dubDay = '0'+dubDay;
	var dlbMonth = dlb.getMonth() + 1;
	if(dlbMonth < 10) dlbMonth = '0'+dlbMonth;
	var dlbDay = dlb.getDate();
	if(dlbDay < 10) dlbDay = '0'+dlbDay;
	var tdlb = dlb.getFullYear()+'-'+dlbMonth+'-'+dlbDay;
	var tdub = dub.getFullYear()+'-'+dubMonth+'-'+dubDay;

	console.log('[FOLD] Fetching server log data from '+tdlb+' to '+tdub+'...');
	$('#btnFoldNow').hide();
	$('#foldStatus').html('Refreshing local data...').show();

	$.ajax({
		type: 'GET',
		url: 'https://'+appSettings.syncPath + '&a=fold&f='+tdlb+'&t='+tdub,
		dataType: 'json',
		success: function(result) {
			if(result.success === true) {
				var sd = result.ld;
				if(sd.length) {
					for(var d=0; d<sd.length; d++) {
						var lsKey = sd[d].lsid;
						var strJson = sd[d].lsdata;
						localStorage.setItem(lsKey, strJson);
						console.log('[FOLD] Set local data for '+lsKey);
					}
				} else {
					console.log('[FOLD] No data available');
				}
				$('#foldStatus').html('Success!');
				var dlf = new Date();
				var dlfDisplay = dlf.toDateString()+' @ '+dlf.toTimeString().split(' ')[0];
				appStats.lastFold = dlfDisplay;
				localStorage.setItem('eptlStats', JSON.stringify(appStats));
				refreshStats();
				setTimeout(function() {
					$('#foldStatus').fadeOut(function() {
						$('#btnFoldNow').show();
					});
				}, 500);
			} else {
				console.log('[FOLD] Error: '+result.error);
			}
			eptlSocket.emit('foldComplete');
		}
	});
}

/* Check for updates */
function eptlCheckForUpdates() {
	checkingForUpdates = true;

	// Return to "add items" view and collapse any expanded sections
	if(userView !== 'addItems') {
		$('#eptl-tld-addItems').click();
	} else {
		if($('#eptl-leftCol-addItems').children('.eptl-rowExpanded').length) {
			$('#eptl-leftCol-addItems').children('.eptl-rowExpanded').click();
		}
	}

	// Shift any existing notifications up
	$('#addItemsNotificationsWrapper').children('.alert').each(function() {
		var cssBottom = $(this).css('bottom');
		var pxBottom = parseInt(cssBottom.substr(0, cssBottom.indexOf('px'))) + 72;
		var bottom = pxBottom+'px';
		if(pxBottom > 78) {
			$(this).remove();
		} else {
			$(this).css('bottom', bottom);
		}
	});

	// Display the notification
	var cfuElem = document.createElement('div');
	var cfuHtml = '<div style="margin:0 auto;width:250px"><div id="cfuSpinner"></div><strong id="cfuStatus">Checking for updates...</strong></div>';
	$(cfuElem).prop('id','cfuAlert').addClass('alert').html(cfuHtml).css('bottom','0px').appendTo('#addItemsNotificationsWrapper');

	// Update app stats
	var lcfuDate = new Date();
	var lcfuTime = lcfuDate.toDateString()+' @ '+lcfuDate.toTimeString().split(' ')[0];
	appStats.lastCfu = lcfuTime;
	localStorage.setItem('eptlStats', JSON.stringify(appStats));
	refreshStats();

	// Check server for updates
	var us = appSettings.syncPath.substr(appSettings.syncPath.indexOf('store=')+6);
	$.ajax({
		type: 'GET',
		url: 'https://server.thebellapizza.com/eptl/update.php?check='+eptlVersion,
		dataType: 'json',
		success: function(result) {
			if(result.latestVersion === eptlVersion) {
				$('#cfuSpinner').hide();
				$('#cfuStatus').css('top',0).html('No updates available!');
				if(eptlSocket) eptlSocket.emit('fcfuComplete', {store:us, updates:false, lcfu:lcfuTime});
				setTimeout(function() {
					$(cfuElem).fadeOut(function() {
						checkingForUpdates = false;
						$(this).remove();
					});
				}, 500);
			} else {
				console.log('Processing updates...');
				if(eptlSocket) eptlSocket.emit('fcfuComplete', {store:us, updates:true, lcfu:lcfuTime});
				processUpdates(result.updates, 0, result.latestVersion);
			}
		}
	});
}

function processUpdates(updatesList, sequence, latestVersion) {
	if(sequence <= updatesList.length - 1) {
		var tun = sequence + 1;
		var thisUpdate = updatesList[sequence];
		$('#cfuStatus').html('Installing update '+tun+' of '+updatesList.length);
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if (this.readyState == 4 && this.status == 200) {
				var blobObj = this.response;
				console.log('Installing update '+tun+' of '+updatesList.length);
				console.log('    File: '+thisUpdate.file);
				console.log('    Type: '+blobObj.type);
				installUpdate(thisUpdate.file, blobObj, tun, updatesList, latestVersion);
			}
		}
		xhr.open('GET', 'https://server.thebellapizza.com/eptl/update.php?getFile='+thisUpdate.file);
		xhr.responseType = 'blob';
		xhr.send();
	} else {
		console.log('Finished processing updates!');
		console.log('Updating version file...');
		$('#cfuStatus').html('Finalizing update(s)');
		updateVersionFile(latestVersion);
	}
}

function updateVersionFile(latestVersion) {
	eptlVersion = latestVersion;
	appSettings.version = eptlVersion;
	localStorage.setItem('eptlSettings', JSON.stringify(appSettings));
	window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
		dirEntry.getFile('eptlVersion.txt', {create: true, exclusive: false}, function(createEntry) {
			createEntry.createWriter(function (fileWriter) {
				fileWriter.onwriteend = function() {
					console.log("Version file created successfully!");
					window.location.reload(true);
				};
				fileWriter.onerror = function (e) {
					console.log("ERROR: Failed file write: " + e.toString());
				};
				var dataObj = new Blob([eptlVersion], { type: 'text/plain' });
				fileWriter.write(dataObj);
			});
		}, function() {
			console.log('ERROR: Failed to create version file');
		});
	}, function() {
		console.log('ERROR: Failed to resolve data directory');
	});
}

function installUpdate(uFile, fData, updateNum, updatesList, latestVersion) {
	var uDir = 'eptlSrc/';
	var ufType = fData.type;
	var ufBlob = new Blob([fData], {type: ufType});
	if(uFile.indexOf('/') !== -1) {
		var lsi = uFile.lastIndexOf('/') + 1;
		var udp = uFile.substr(0, lsi);
		var ufp = uFile.substr(lsi);
		uDir += udp;
		uFile = ufp;
	}

	window.resolveLocalFileSystemURL(cordova.file.dataDirectory+uDir, function (dirEntry) {
		dirEntry.getFile(uFile, {create: true, exclusive: false}, function(createEntry) {
			createEntry.createWriter(function (fileWriter) {
				fileWriter.onwriteend = function() {
					processUpdates(updatesList, updateNum, latestVersion);
				};
				fileWriter.onerror = function (e) {
					console.log('ERROR: Failed to write file: '+uFile+' (Update '+updateNum+' of '+updatesList.length+')');
				};
				fileWriter.write(ufBlob);
			});
		}, function() {
			console.log('ERROR: Failed to create file: '+uFile+' (Update '+updateNum+' of '+updatesList.length+')');
		});
	}, function() {
		console.log('ERROR: Failed to resolve path: '+uDir+' (Update '+updateNum+' of '+updatesList.length+')');
	});
}

function checkEptlVersion() {
	if(fsReady) {
		if(!versionCheckedAndSet) {
			window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
				console.log('Checking EPTL version...');
				dirEntry.getFile('eptlVersion.txt', {create: false, exclusive: false}, function(fileEntry) {
					fileEntry.file(function (file) {
						var reader = new FileReader();
						reader.onloadend = function() {
							console.log("EPTL Version: " + this.result);
							eptlVersion = this.result;
							appSettings.version = eptlVersion;
							localStorage.setItem('eptlSettings', JSON.stringify(appSettings));
							versionCheckedAndSet = true;
						}
						reader.readAsText(file);
					}, function() {
						console.log('ERROR: Failed to read version file');
					});
				}, function() {
					console.log('ERROR: Failed to open version file');
				});
			}, function() {
				console.log('ERROR: Failed to resolve data directory');
			});
		}
	} else {
		console.log('[checkEptlVersion] File system not ready! Retrying in 1 second');
		setTimeout(checkEptlVersion, 1000);
	}
}

/* On App Load */
$(document).ready(function() {
	if(localStorage.getItem(lsKey) === null) lsInit();
	if(localStorage.getItem('eptlSettings') === null) initSettings();
	if(appSettings.length === 0) loadSettings();
	initStats();
	lastItemAdded = new Date();
	lastUserAction = new Date();

	setupTimeTable();
	setupLogTable();

	// Shift the visible time table every hour
	var syncTime = setInterval(function() {
		var std = new Date();
		if(std.getSeconds() === 0) {
			clearInterval(syncTime);
			timeCheck = setInterval(function() {
				var d = new Date();
				if(d.getMinutes() === 0) setupTimeTable();
				if(d.toDateString() !== lsKey) lsInit();
				if(appSettings.alertExpiredItems === 'true') checkExpiredItems();
				if(d.getHours() >= 10 && d.getHours() <= 12) alertDuringOpen();
				checkUserIdle(d);
				syncData();
			}, 60000);
		}
	}, 1000);

	// Show the clock
	setTimeout(function() {
		clockTapTimer = null;
		clockTaps = 0;
		if(!$('#eptl-leftCol-addItems').children('.eptl-rowExpanded').length) $('#eptlClock').fadeIn();
	}, 1100);

	// Update the clock every second
	eptlClock = setInterval(function(){updateTime();}, 1000);

	// Initialize device event handlers
	document.addEventListener("deviceready", onDeviceReady, false);
	document.addEventListener("pause", onDevicePause, false);
	document.addEventListener("resume", onDeviceResume, false);
	document.addEventListener("volumedownbutton", onVolumeDownButtonPressed, false);

	// Initialize breadsticks quantity slider
	$('#eptl-addItems-bsQtySlider').slider({
		value: appSettings.defaultBsticksQty,
		ticks: [12, 24, 36, 48],
		ticks_snap_bounds: 10,
		step: 12,
		formatter: function(value) {
			$('#eptl-addItems-bsQty').val(value);
		}
	});

	// Display the current version
	$('#eptlVersion').html('Version '+eptlVersion+'<br><span>'+eptlUpdated+'</span>');

	// Initialize the RC web socket
	initSocket();

	// Debug only -- add option to open new window with fixed dimensions
	if(eptlDebug) {
		if(!$('#eptl-tld-debug').length) {
			var newOpt = '<li role="separator" class="divider"></li>';
			newOpt += '<li id="eptl-tld-debug"><a href="#">Open Debug Window</a></li>';
			$('#eptl-topLeftCell').children('.dropdown').children('.dropdown-menu').append(newOpt);
		}
	}
});
