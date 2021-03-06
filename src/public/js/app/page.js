// 主页渲染
//-------------

var Resize;

// 写作模式
var Writting = {
	_mode: 'normal', // writting
	themeWrittingO: $('#themeWritting'),
	writtingToggleO: $('#writtingToggle'),
	bodyO: $('body'),
	isWriting: function() {
		return this._mode != 'normal';
	},
	init: function() {
		var me = this;
		me.writtingToggleO.click(function() {
			me.toggle();
		});
	},

	// 初始化写作
	// 主要是markdown两列宽度问题
	initWritting: function() {
		var width = UserInfo.MdEditorWidthForWritting;
		// 设中间
		if(!width) {
			width = this.bodyO.width() / 2;
		}
		Resize.setMdColumnWidth(width);
		// $("#mceToolbar").css("height", "40px");
		resizeEditor();
	},
	initNormal: function() {
		Resize.setMdColumnWidth(UserInfo.MdEditorWidth);
		// $("#mceToolbar").css("height", "30px");
		resizeEditor();
	},

	toggle: function() {
		var me = this;
		me.themeWrittingO.attr('disabled', me._mode != 'normal');
		me._mode = me._mode == 'normal' ? 'writting' : 'normal';

		// 改变icon
		if(me._mode != 'normal') {
			$('body').addClass('writting');
			me.writtingToggleO.find('.fa').removeClass('fa-expand').addClass('fa-compress');

			me.initWritting();
		} else {
			$('body').removeClass('writting');
			me.writtingToggleO.find('.fa').removeClass('fa-compress').addClass('fa-expand');
			me.initNormal();
		}
	},
};

//----------------
// 拖拉改变变宽度
var Resize = {
	lineMove: false,
	mdLineMove: false,
	target: null,
	
	leftNotebook: $("#leftNotebook"),
	notebookSplitter: $("#notebookSplitter"),
	noteList: $("#noteList"),
	noteAndEditor: $("#noteAndEditor"),
	noteSplitter: $("#noteSplitter"),
	note: $("#note"),
	body: $("body"),
	leftColumn: $("#left-column"),
	rightColumn: $("#right-column"), // $("#preview-panel"), // 
	mdSplitter: $("#mdSplitter2"),
	
	init: function() {
		var self = this;
		self.initEvent();
	},
	
	initEvent: function() {
		var self = this;
		
		// 鼠标点下
		$(".noteSplit").bind("mousedown", function(event) {
			event.preventDefault(); // 防止选择文本
			self.lineMove = true;
			$(this).css("background-color", "#ccc");
			self.target = $(this).attr("id");
			// 防止iframe捕获不了事件
			$("#noteMask").css("z-index", 99999); // .css("background-color", // "#ccc");
		});
		
		// 鼠标点下
		self.mdSplitter.bind("mousedown", function(event) {
			event.preventDefault(); // 防止选择文本
			if($(this).hasClass('open')) {
				self.mdLineMove = true;
			}
			// $(this).css("background-color", "#ccc");
		});
		
		// 鼠标移动时
		self.body.bind("mousemove", function(event) {
			if(self.lineMove) { // 如果没有这个if会导致不能选择文本
				event.preventDefault();
				self.resize3Columns(event);
			} else if(self.mdLineMove) {
				event.preventDefault();
				self.resizeMdColumns(event);
			}
		});	

		// 鼠标放开, 结束
		self.body.bind("mouseup", function(event) {
			self.stopResize();
			// 取消遮罩
			$("#noteMask").css("z-index", -1);
		});
		
		// 瞬间
		var everLeftWidth;
		$('.layout-toggler-preview').click(function() {
			var $t = $(this);
			var $p = self.leftColumn.parent();
			// 是开的
			if($t.hasClass('open')) {
				var totalWidth = $p.width();
				var minRightWidth = 22;
				var leftWidth = totalWidth - minRightWidth;
				everLeftWidth = self.leftColumn.width();
				self.leftColumn.width(leftWidth);
				self.rightColumn.css('left', 'auto').width(minRightWidth);
				
				// 禁止split
				$t.removeClass('open');//.addClass('close');
				self.rightColumn.find('.layout-resizer').removeClass('open');
				$('.preview-container').hide();
			} else {
				$t.addClass('open');
				self.rightColumn.find('.layout-resizer').addClass('open');
				self.leftColumn.width(everLeftWidth);
				$('.preview-container').show();
				self.rightColumn.css('left', everLeftWidth).width('auto');
				
				if(MD) { 
					MD.onResize();
				}
			}
		});
	},
	// 停止, 保存数据
	stopResize: function() {
		var self = this;
		if(self.lineMove || self.mdLineMove) {
			// ajax保存
			UserService.updateG({
				MdEditorWidth: UserInfo.MdEditorWidth, 
				MdEditorWidthForWritting: UserInfo.MdEditorWidthForWritting,
				NotebookWidth: UserInfo.NotebookWidth, 
				NoteListWidth: UserInfo.NoteListWidth
			}, function() {
				// alert(UserInfo.NotebookWidth);
			});
		}
		self.lineMove = false;
		self.mdLineMove = false;
		$(".noteSplit").css("background", "none");
		self.mdSplitter.css("background", "none");
	},
	
	// 最终调用该方法
	set3ColumnsWidth: function(notebookWidth, noteListWidth) {
		var self = this;
		if(notebookWidth < 150 || noteListWidth < 100) {
			return;
		}
		var noteWidth = self.body.width() - notebookWidth - noteListWidth;
		if(noteWidth < 400) {
			return;
		}
		
		self.leftNotebook.width(notebookWidth);
		self.notebookSplitter.css("left", notebookWidth);
		
		self.noteAndEditor.css("left", notebookWidth);
		self.noteList.width(noteListWidth);
		self.noteSplitter.css("left", noteListWidth);
		self.note.css("left", noteListWidth + 2);
		
		UserInfo.NotebookWidth = notebookWidth;
		UserInfo.NoteListWidth = noteListWidth;
	},
	resize3Columns: function(event, isFromeIfr) {
		var self = this;
		if (isFromeIfr) {
			event.clientX += self.body.width() - self.note.width();
		}
		
		var notebookWidth, noteListWidth;
		if(self.lineMove) {
			if (self.target == "notebookSplitter") {
				notebookWidth = event.clientX;
				noteListWidth = self.noteList.width();
				self.set3ColumnsWidth(notebookWidth, noteListWidth);
			} else {
				notebookWidth = self.leftNotebook.width();
				noteListWidth = event.clientX - notebookWidth;
				self.set3ColumnsWidth(notebookWidth, noteListWidth);
			}
	
			resizeEditor();
		}
	},
	
	// mdeditor
	resizeMdColumns: function(event) {
		var self = this;
		if (self.mdLineMove) {
			var mdEditorWidth = event.clientX - self.leftColumn.offset().left; // self.leftNotebook.width() - self.noteList.width();
			self.setMdColumnWidth(mdEditorWidth);
		}
	},

	// 设置宽度
	setMdColumnWidth: function(mdEditorWidth) { 
		var self = this;
		if(mdEditorWidth > 100) {
			if(Writting.isWriting()) {
				UserInfo.MdEditorWidthForWritting = mdEditorWidth;
			} else {
				UserInfo.MdEditorWidth = mdEditorWidth;
			}

			// log(mdEditorWidth)
			self.leftColumn.width(mdEditorWidth);
			self.rightColumn.css("left", mdEditorWidth);
			// self.mdSplitter.css("left", mdEditorWidth);
		}
		
		// 这样, scrollPreview 才会到正确的位置
		if(MD) {
			MD.onResize();
		}
	}
};

//--------------------------
// 手机端访问之
Mobile = {
	// 点击之笔记
	// 切换到编辑器模式
	noteO: $("#note"),
	bodyO: $("body"),
	setMenuO: $("#setMenu"),
	// 弃用, 统一使用Pjax
	hashChange: function() {
		var self = Mobile;
		var hash = location.hash;
		// noteId
		if(hash.indexOf("noteId") != -1) {
			self.toEditor(false);
			var noteId = hash.substr(8);
			Note.changeNote(noteId, false, false);
		} else {
			// 笔记本和笔记列表
			self.toNormal(false);
		}
	},
	init: function() {
		var self = this;
		self.isMobile();
	},
	isMobile: function() {
		var u = navigator.userAgent;
		LEA.isMobile = false;
		LEA.isMobile = /Mobile|Android|iPhone|iPad/i.test(u);
		LEA.isIpad =  /iPad/i.test(u);
		LEA.isIphone = /iPhone/i.test(u);
		if(!LEA.isMobile && $(document).width() <= 700){ 
			LEA.isMobile = true
		}
		return LEA.isMobile;
	},
	// 改变笔记, 此时切换到编辑器模式下
	// note.js click事件处理, 先切换到纯编辑器下, 再调用Note.changeNote()
	changeNote: function(noteId) {
		var self = this;
		if(!LEA.isMobile) {return true;}
		self.toEditor(true, noteId);
		return false;
	},
	
	toEditor: function(changeHash, noteId) {
		var self = this;
		self.bodyO.addClass("full-editor");
		self.noteO.addClass("editor-show");
		/*
		if(changeHash) {
			if(!noteId) {
				noteId = Note.curNoteId;
			}
			location.hash = "noteId=" + noteId;
		}
		*/
	},
	toNormal: function(changeHash) {
		var self = this;
		self.bodyO.removeClass("full-editor");
		self.noteO.removeClass("editor-show");
	
		/*
		if(changeHash) {
			location.hash = "notebookAndNote";
		}
		*/
	},
	switchPage: function() {
		var self = this;
		if(!LEA.isMobile || LEA.isIpad) {return true;}
		if(self.bodyO.hasClass("full-editor")) {
			self.toNormal(true);
		} else {
			self.toEditor(true);
		}
		return false;
	}
};

function initSlimScroll() {
	return;
}

//-----------
// 初始化编辑器
function initEditor() {
	// editor
	// toolbar 下拉扩展, 也要resizeEditor
	var mceToobarEverHeight = 0;
	$("#moreBtn").click(function() {
		saveBookmark();
		var $editor = $('#editor');
		if($editor.hasClass('all-tool')) {
			$editor.removeClass('all-tool');
		} else {
			$editor.addClass('all-tool');
		}

		restoreBookmark();
		return;

		var height = $("#mceToolbar").height();

		// 现在是折叠的
		if (height < $("#popularToolbar").height()) {
			$("#mceToolbar").height($("#popularToolbar").height());
			$(this).find("i").removeClass("fa-angle-down").addClass("fa-angle-up");
			mceToobarEverHeight = height;
		} else {
			$("#mceToolbar").height(mceToobarEverHeight);
			$(this).find("i").removeClass("fa-angle-up").addClass("fa-angle-down");
		}
		
		resizeEditor();
		
		restoreBookmark();
	});

	// 初始化编辑器
	tinymce.init({
		inline: true,
		valid_children: "+pre[div|#text|p|span|textarea|i|b|strong]", // ace
		setup: function(ed) {
			// desk下有问题
			// ed.on('keydown', Note.saveNote);
			ed.on('keydown', function(e) { 
				var num = e.which ? e.which : e.keyCode;
				if(e.ctrlKey || e.metaKey) {
				    if(num == 86) { // ctrl + v
				    	// document.execCommand('paste');
				    }
			    };
			});
			
			// 为了把下拉菜单关闭
	        ed.on("click", function(e) {
	          $("body").trigger("click");
	        });
		},
		
		// fix TinyMCE Removes site base url
		// http://stackoverflow.com/questions/3360084/tinymce-removes-site-base-urls
		convert_urls:true,
		relative_urls:false,
		remove_script_host:false,
		
		selector : "#editorContent",
		// height: 100,//这个应该是文档的高度, 而其上层的高度是$("#content").height(),
		// parentHeight: $("#content").height(),
		// content_css : ["public/css/editor/editor.css"],
		skin : "custom",
		language: LEA.locale, // 语言
		plugins : [
				"autolink link image lists charmap hr", "paste",
				"searchreplace leanote_nav leanote_code tabfocus",
				"table directionality textcolor" ], // nonbreaking
				
		toolbar1 : "formatselect | forecolor backcolor | bold italic underline strikethrough | image | leanote_code leanote_inline_code | bullist numlist | alignleft aligncenter alignright alignjustify",
		toolbar2 : "outdent indent blockquote | link unlink | table | hr removeformat | subscript superscript |searchreplace | pastetext pasteCopyImage | leanote_ace_pre | fontselect fontsizeselect",

		// 使用tab键: http://www.tinymce.com/wiki.php/Plugin3x:nonbreaking
		// http://stackoverflow.com/questions/13543220/tiny-mce-how-to-allow-people-to-indent
		// nonbreaking_force_tab : true,
		
		menubar : false,
		toolbar_items_size : 'small',
		statusbar : false,
		url_converter: false,
		font_formats : "Arial=arial,helvetica,sans-serif;"
				+ "Arial Black=arial black,avant garde;"
				+ "Times New Roman=times new roman,times;"
				+ "Courier New=courier new,courier;"
				+ "Tahoma=tahoma,arial,helvetica,sans-serif;"
				+ "Verdana=verdana,geneva;" + "宋体=SimSun;"
				+ "新宋体=NSimSun;" + "黑体=SimHei;"
				+ "微软雅黑=Microsoft YaHei",
		block_formats : "Header 1=h1;Header 2=h2;Header 3=h3;Header 4=h4;Paragraph=p",
		  // This option specifies whether data:url images (inline images) should be removed or not from the pasted contents. 
		  // Setting this to "true" will allow the pasted images, and setting this to "false" will disallow pasted images.  
		  // For example, Firefox enables you to paste images directly into any contentEditable field. This is normally not something people want, so this option is "false" by default.
		  paste_data_images: true
	});
	
	// 刷新时保存 参考autosave插件
	window.onbeforeunload = function(e) {
    	Note.curChangedSaveIt();
	};
	
	// 全局ctrl + s
	$("body").on('keydown', Note.saveNote);
}

//-----------------------
// 导航
var random = 1;
function scrollTo(self, tagName, text) {
	var iframe = $("#editorContent"); // .contents();
	if(Writting.isWriting()) { 
		iframe = $('#editorContentWrap');
	}
	var target = iframe.find(tagName + ":contains(" + text + ")");
	random++;
	
	// 找到是第几个
	// 在nav是第几个
	var navs = $('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]');
//	alert('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]')
	var len = navs.size();
	for(var i = 0; i < len; ++i) {
		if(navs[i] == self) {
			break;
		}
	}
	
	if (target.size() >= i+1) {
		target = target.eq(i);
		// 之前插入, 防止多行定位不准
		// log(target.scrollTop());
		var top = iframe.scrollTop() - iframe.offset().top + target.offset().top; // 相对于iframe的位置
		// var nowTop = iframe.scrollTop();
		// log(nowTop);
		// log(top);
		// iframe.scrollTop(top);
		iframe.animate({scrollTop: top}, 300); // 有问题
		return;
	}
}

// 设置宽度， 三栏
function setLayoutWidth() {
	//------------------------
	// 界面设置, 左侧是否是隐藏的
	UserInfo.NotebookWidth = UserInfo.NotebookWidth || $("#notebook").width();
	UserInfo.NoteListWidth = UserInfo.NoteListWidth || $("#noteList").width();
	
	Resize.init();
	// alert(UserInfo.NotebookWidth);
	Resize.set3ColumnsWidth(UserInfo.NotebookWidth, UserInfo.NoteListWidth);
	Resize.setMdColumnWidth(UserInfo.MdEditorWidth);
}

//--------------
// 调用之
$(function() {
	// 窗口缩放时
	$(window).resize(function() {
		Mobile.isMobile();
		resizeEditor();
	});
	
	// 初始化编辑器
	initEditor();

	// 左侧, folder 展开与关闭
	$(".folderHeader").click(function() {
		var body = $(this).next();
		var p = $(this).parent();
		if (!body.is(":hidden")) {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.hide();
			p.removeClass("opened").addClass("closed");
			$(this).find(".fa-angle-down").removeClass("fa-angle-down").addClass("fa-angle-right");
		} else {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.show();
			p.removeClass("closed").addClass("opened");
			$(this).find(".fa-angle-right").removeClass("fa-angle-right").addClass("fa-angle-down");
		}
	});
	
	// 导航隐藏与显示
	$(".leanoteNav h1").on("click", function(e) {
		var $leanoteNav = $(this).closest('.leanoteNav');
		if (!$leanoteNav.hasClass("unfolder")) {
			$leanoteNav.addClass("unfolder");
		} else {
			$leanoteNav.removeClass("unfolder");
		}
	});
	
	// 打开设置
	function openSetInfoDialog(whichTab) {
		showDialogRemote("/user/account", {tab: whichTab});
	}

	// 禁止双击选中文字
	$("#notebook, #newMyNote, #myProfile, #topNav, #notesAndSort", "#leanoteNavTrigger").bind("selectstart", function(e) {
		e.preventDefault();
		return false;
	});
	
	// 得到最大dropdown高度
	// 废弃
	function getMaxDropdownHeight(obj) {
		var offset = $(obj).offset();
		var maxHeight = $(document).height()-offset.top;
		maxHeight -= 70;
		if(maxHeight < 0) {
			maxHeight = 0;
		}	
		
		var preHeight = $(obj).find("ul").height();
		return preHeight < maxHeight ? preHeight : maxHeight;
	}
	
	// markdown preview下的a不能点击
	$('#preview-contents').on('click', 'a', function(e) {
		e.preventDefault();
		return false;
	});

	// markdown编辑器paste
	$('#wmd-input-sub').on('paste', function(e) {
		pasteImage(e);
	});
});


//------------
// pjax
//------------
var Pjax = {
	init: function() {
		var me = this;
		// 当history改变时
		window.addEventListener('popstate', function(evt){
			var state = evt.state;
			if(!state) {
				return;
			}
			document.title = state.title || "Untitled";
			log("pop");
			me.changeNotebookAndNote(state.noteId);
		}, false);
		
		// ie9
		if(!history.pushState) {
			$(window).on("hashchange", function() {
				var noteId = getHash("noteId");;
				if(noteId) {
					me.changeNotebookAndNote(noteId);
				}
			});
		}
	},
	// pjax调用
	// popstate事件发生时, 转换到noteId下, 此时要转换notebookId
	changeNotebookAndNote: function(noteId) {
		var note = Note.getNote(noteId);
		if(!note) {
			return;
		}
		var isShare = note.Perm != undefined;
		
		var notebookId = note.NotebookId;
		// 如果是在当前notebook下, 就不要转换notebook了
		if(Notebook.curNotebookId == notebookId) {
			// 不push state
			Note.changeNoteForPjax(noteId, false);
			return;
		}
		
		// 自己的
		if(!isShare) {
			// 先切换到notebook下, 得到notes列表, 再changeNote
			Notebook.changeNotebook(notebookId, function(notes) {
				Note.renderNotes(notes);
				// 不push state
				Note.changeNoteForPjax(noteId, false, true);
			});
		// 共享笔记
		} else {
			Share.changeNotebook(note.UserId, notebookId, function(notes) {
				Note.renderNotes(notes);
				// 不push state
				Note.changeNoteForPjax(noteId, false, true);
			});
		}
	},
		
	// ajax后调用
	changeNote: function(noteInfo) {
		var me = this;
		// life
		return;
		log("push");
		var noteId = noteInfo.NoteId;
		var title = noteInfo.Title;
		var url = '/note/' + noteId;
		if(location.hash) {
			url += location.hash;
		}
		// 如果支持pushState
		if(history.pushState) {
			var state=({
				url: url,
				noteId: noteId,
				title: title,
			});
			history.pushState(state, title, url);
			document.title = title || 'Untitled';
		// 不支持, 则用hash
		} else {
			setHash("noteId", noteId);
		}
	}
};
$(function() {
	Pjax.init();
});

//----------
// aceEditor
LeaAce = {
	// aceEditorID
	_aceId: 0,
	// {id=>ace}
	_aceEditors: {},
	_isInit: false,
	_canAce: false,
	isAce: true, // 切换pre, 默认是true
	disableAddHistory: function() {
		tinymce.activeEditor.undoManager.setCanAdd(false);
	},
	resetAddHistory: function() {
		tinymce.activeEditor.undoManager.setCanAdd(true);
	},
	canAce: function() {
		return true;
		/*
		if(this._isInit) {
			return this._canAce;
		}
		if(getVendorPrefix() == "webkit" && !Mobile.isMobile()) {
			this._canAce = true;
		} else {
			this._canAce = false;
		}
		this._isInit = true;
		return this._canAce;
		*/
	},
	canAndIsAce: function() {
		return this.canAce() && this.isAce;
	},
	getAceId: function () {
		this.aceId++;
		return "leanote_ace_" + (new Date()).getTime() + "_" + this._aceId;
	},
	initAce: function(id, val, force) {
		try {
			var me = this;
			if(!force && !me.canAndIsAce()) {
				return;
			}
			me.disableAddHistory();
			var $pre = $('#' + id);
			if($pre.length == 0) {
				return;
			}
			$pre.find('.toggle-raw').remove();
			var preHtml = $pre.html();

			$pre.removeClass('ace-to-pre');
			$pre.attr("contenteditable", false); // ? 避免tinymce编辑
			var aceEditor = ace.edit(id);
			aceEditor.setShowInvisibles(false);
			aceEditor.setTheme("ace/theme/tomorrow");

			var brush = me.getPreBrush($pre);
			var b = "";
			if(brush) {
				try {
					b = brush.split(':')[1];
				} catch(e) {}
			}
			b = b || "javascript";
			aceEditor.session.setMode("ace/mode/" + b);
			aceEditor.session.setOption("useWorker", false); // 不用语法检查
			aceEditor.getSession().setUseWorker(false); // 不用语法检查
			aceEditor.setOption("showInvisibles", false); // 不显示空格, 没用
			aceEditor.setShowInvisibles(false); // OK 不显示空格
			aceEditor.setOption("wrap", "free");
			aceEditor.setShowInvisibles(false);
			aceEditor.setAutoScrollEditorIntoView(true);
			aceEditor.setOption("maxLines", 10000);
			aceEditor.commands.addCommand({
			    name: "undo",
			    bindKey: {win: "Ctrl-z", mac: "Command-z"},
			    exec: function(editor) {
			    	var undoManager = editor.getSession().getUndoManager();
			    	if(undoManager.hasUndo()){ 
			    		undoManager.undo();
			    	} else {
			    		undoManager.reset();
			    		tinymce.activeEditor.undoManager.undo();
			    	}
			    }
			});
			this._aceEditors[id] = aceEditor;
			if(val) {
				aceEditor.setValue(val);
				// 不要选择代码
				// TODO
			} else {
				// 防止 <pre><div>xx</div></pre> 这里的<div>消失
				// preHtml = preHtml.replace('/&nbsp;/g', ' '); // 以前是把' ' 全换成了&nbsp;
				// aceEditor.setValue(preHtml);
				// 全不选
				// aceEditor.selection.clearSelection();
			}

			// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

			me.resetAddHistory();
			return aceEditor;
		} catch(e) {

		}
	},
	clearIntervalForInitAce: null,
	initAceFromContent: function(editor) {
		if(!this.canAndIsAce()) {
			var content = $(editor.getBody());
			content.find('pre').removeClass('ace_editor');
			return;
		}
		var me = this;
		// 延迟
		if(this.clearIntervalForInitAce) {
			clearInterval(this.clearIntervalForInitAce);
		}
		this.clearIntervalForInitAce = setTimeout(function() {
			var content = $(editor.getBody());
			var pres = content.find('pre');
			for(var i = 0 ; i < pres.length; ++i) {
				var pre = pres.eq(i);
				// 如果不是ace
				if(me.isInAce(pre)) {
					break;
				}
				setTimeout((function(pre) {
					return function() {
						pre.find('.toggle-raw').remove();
						var value = pre.html();
						log(value);
						value = value.replace(/ /g, "&nbsp;").replace(/\<br *\/*\>/gi,"\n").replace(/</g, '&lt;').replace(/>/g, '&gt;');
						pre.html(value);
						var id = pre.attr('id');
						if(!id) {
							id = me.getAceId();
							pre.attr('id', id);
						}
						me.initAce(id);
					}
				})(pre));
			}
		}, 10);
	},

	allToPre: function(editor) {
		if(!this.canAndIsAce()) {
			return;
		}
		var me = this;
		// 延迟
		if(me.clearIntervalForInitAce) {
			clearInterval(me.clearIntervalForInitAce);
		}
		me.clearIntervalForInitAce = setTimeout(function() {
			var content = $(editor.getBody());
			var pres = content.find('pre');
			for(var i = 0 ; i < pres.length; ++i) {
				var pre = pres.eq(i);
				setTimeout((function(pre) {
					return function() {
						me.aceToPre(pre);
					}
				})(pre));
			}
		}, 10);
	},

	undo: function(editor) {
		if(!this.canAndIsAce()) {
			return;
		}
		var me = this;
		// 延迟
		if(this.clearIntervalForInitAce) {
			clearInterval(this.clearIntervalForInitAce);
		}
		this.clearIntervalForInitAce = setTimeout(function() {
			var content = $(editor.getBody());
			var pres = content.find('pre');
			for(var i = 0 ; i < pres.length; ++i) {
				var pre = pres.eq(i);
				setTimeout((function(pre) {
					return function() {
						var value = pre.html();
						var id = pre.attr('id');
						var aceEditor = me.getAce(id);
						if(aceEditor) {
							var value = aceEditor.getValue();
							aceEditor.destroy();
							var aceEditor = me.initAce(id, value);
							// 全不选
							aceEditor.selection.clearSelection();
						} else {
							value = value.replace(/ /g, "&nbsp;").replace(/\<br *\/*\>/gi,"\n");
							pre.html(value);
							var id = pre.attr('id');
							if(!id) {
								id = me.getAceId();
								pre.attr('id', id);
							}
							me.initAce(id);
						}
					}
				})(pre));
			}
		}, 10);
	},
	destroyAceFromContent: function(everContent) {
		if(!this.canAce()) {
			return;
		}
		var pres = everContent.find('pre');
		for(var i = 0 ; i < pres.length; ++i) {
			var id = pres.eq(i).attr('id');
			var aceEditorAndPre = this.getAce(id);
			if(aceEditorAndPre) {
				aceEditorAndPre.destroy();
				this._aceEditors[id] = null;
			}
		}
	},
	getAce: function(id) {
		if(!this.canAce()) {
			return;
		}
		return this._aceEditors[id];
	},
	// 当前焦点是否在aceEditor中
	nowIsInAce: function () {
		if(!this.canAce()) {
			return;
		}
		
		var node = tinymce.activeEditor.selection.getNode();
		// log("now...");
		// log(node);
		return this.isInAce(node);

	},
	nowIsInPre: function(){
		var node = tinymce.activeEditor.selection.getNode();
		// log("now...");
		// log(node);
		return this.isInPre(node);
	},
	isInPre: function(node) {
		var $node = $(node);
		var node = $node.get(0);
		if(node.nodeName == "PRE") {
			return true;
		} else {
			// 找到父是pre
			$pre = $node.closest("pre");
			if($pre.length == 0) {
				return false;
			}
			return true;
		}
	},
	// 是否在node内
	isInAce: function(node) {
		if(!this.canAce()) {
			return;
		}
		var $node = $(node);
		var node = $node.get(0);
		if(node.nodeName == "PRE") {
			// $node.data('brush', brush);
			var id = $node.attr('id');
			var aceEditor = this.getAce(id);
			if(aceEditor) {
				return [aceEditor, $node];
			}
			return false;
		} else {
			// 找到父是pre
			$pre = $node.closest("pre");
			if($pre.length == 0) {
				return false;
			}
			return this.isInAce($pre);
		}
		return false;
	},
	getPreBrush: function (node) {
		var $pre = $(node);
		var classes = $pre.attr('class');
		if(!classes) {
			return '';
		}
		var m = classes.match(/brush:[^ ]*/);
		var everBrush = "";
		if(m && m.length > 0) {
			everBrush = m[0];
		}	
		return everBrush;
	},
	// pre转换成ace
	preToAce: function (pre, force) {
		if(!force && !this.canAce()) {
			return;
		}
		var $pre = $(pre);
		var id = this.getAceId();
		$pre.attr('id', id);
		var editor = this.initAce(id, "", true);
		if(editor) {
			editor.focus();
		}
	},
	aceToPre: function(pre, isFocus) {
		var me = this;
		var $pre = $(pre);
		// 转成pre
		var aceEditorAndPre = me.isInAce($pre);
		if(aceEditorAndPre) {
			var aceEditor = aceEditorAndPre[0];
			var $pre = aceEditorAndPre[1];
			var value = aceEditor.getValue();
			value = value.replace(/</g, '&lt').replace(/>/g, '&gt');
			// var id = getAceId();
			var replacePre = $('<pre class="' + $pre.attr('class') + ' ace-to-pre">' + value + "</pre>");
			$pre.replaceWith(replacePre);
			aceEditor.destroy();
			me._aceEditors[$pre.attr('id')] = null;
			// log($replacePre);
			if(isFocus) {
				setTimeout(function() {
					var tinymceEditor = tinymce.activeEditor;
					var selection = tinymceEditor.selection;
					var rng = selection.getRng();
					// rng.setStart(replacePre.get(0), 1);
					// rng.setEnd(replacePre.get(0), 9);
					rng.selectNode(replacePre.get(0));
					// selection.setRng(rng);
					// replacePre.focus();
					tinymceEditor.focus();
					replacePre.trigger("click");
					replacePre.html(value + " ");
					// log(">>>>>>>>>>>>>>")
				}, 0);
			}
		}
	},
	// 转换raw <-> code
	handleEvent: function () {
		if(!this.canAce()) {
			return;
		}
		var me = this;
		$("#editorContent").on('mouseenter', 'pre', function(){
			// log('in');
			// log($(this));
			var $t = $(this);
			$raw = $t.find('.toggle-raw');
			if($raw.length == 0) {
				$t.append('<div class="toggle-raw" title="Toggle code with raw html"><input type="checkbox" /></div>');
			}
			$input = $t.find('.toggle-raw input');
			if(LeaAce.isInAce($t)) {
				$input.prop('checked', true);
			} else {
				$input.prop('checked', false);
			}
		});
		$("#editorContent").on('mouseleave', 'pre', function(){
			var $raw = $(this).find('.toggle-raw');
			$raw.remove();
		});
		$("#editorContent").on('change', '.toggle-raw input', function(){
			var checked = $(this).prop('checked');
			var $pre = $(this).closest('pre');
			if(checked) {
				// 转成ace
				me.preToAce($pre, true);
			} else {
				me.aceToPre($pre, true);
			}
		});
	}
};

// 全量同步
function fullSync(callback) {
	log('full sync');
	SyncService.fullSync(function(ret) {
		log('after....')
		log(ret);
		callback && callback();
	});
}

// 增量同步
function incrSync() {
	log('incr sync');
	Note.showSpin();
	SyncService.incrSync();
}

// 历史, 恢复原貌
var State = {
	// 保存当前状态
	// 什么时候调用? 关闭程序, 改变note时
	saveCurState: function(callback) {
		// 左侧, 开闭状态
		var StarredOpened = false;
		var NotebookOpened = false;
		var TagOpened = false;
		var $leftOpen = $('.folderNote.opened');
		if($leftOpen.length == 1) {
			var id = $leftOpen.attr('id');
			if(id == 'myStarredNotes') {
				StarredOpened = true;
			} else if(id == 'myNotebooks') {
				NotebookOpened = true;
			} else if(id == 'myTag') {
				TagOpened = true;
			}
		}
		// 当前笔记
		var CurNoteId = Note.curNoteId; // 当前打开的笔记
		var CurIsStarred = false; // 当前是在星下
		var CurNotebookId = ''; // 定位到某个笔记本
		var CurTag = ''; // 搜索tag
		if(Notebook.isSearch) {
			var CurSearchKey = Note.searchKey;
		}
		if(Notebook.isStarred) {
			CurIsStarred = true;
		} else if(Notebook.isTag) {
			CurTag = Tag.curTag;
		}
		CurNotebookId = Notebook.curNotebookId;

		var state = {
			StarredOpened: StarredOpened, 
			NotebookOpened: NotebookOpened,
			TagOpened: TagOpened,

			CurNoteId: CurNoteId,
			CurIsStarred: CurIsStarred,
			CurNotebookId: CurNotebookId,
			CurTag: CurTag,
			CurSearchKey: CurSearchKey
		};
		// console.log(state);
		UserService.saveCurState(state, callback);
	},

	// 是否结束
	recoverEnd: false,

	recoverAfter: function() {
		var me = this;
		me.recoverEnd = true;
		// 先隐藏, 再resize, 再显示
		$('body').hide();
		// 延迟, 让body先隐藏, 效果先显示出来
		setTimeout(function() {
			if(isMac()) {
				win.resizeTo(1100, 600);
				win.setPosition('center');
			}
			setTimeout(function() {
				$('body').show();
				$('body').removeClass('init');
				$("#mainMask").html("");
				$("#mainMask").hide(0);
			}, 100);
		});

		// end
		// 打开时，同步一下
		setTimeout(function() {
			incrSync();
		}, 500);
		// $('body').show();
	},

	// 恢复状态
	recoverState: function(userInfo) {
		var state = userInfo.State || {};
		// 表明没有state
		if(state.NotebookOpened === undefined) {
			this.recoverAfter();
			return;
		}
		// 1. 左侧哪个open
		if(!state.NotebookOpened) { 
			$('.folderNote.opened').removeClass('opened').addClass('closed');
			if(state.StarredOpened) {
				$('#myStarredNotes').removeClass('closed').addClass('opened');
			} else if(state.TagOpened) {
				$('#myTag').removeClass('closed').addClass('opened');
			}
		}
		// 2. 
		// 当前是starred notes
		var notebookId = state.CurNotebookId;
		if(state.CurIsStarred) {
			Note.renderStarNote($('#myStarredNotes li[data-id="' + state.CurNoteId + '"]'));
		}
		// 搜索标签
		else if(state.CurTag) {
			Tag.searchTag(state.CurTag, state.CurNoteId);
		}
		// 搜索笔记
		else if(state.CurSearchKey) {
			Note.searchNoteSys(state.CurSearchKey, state.CurNoteId);
		}
		// 笔记本了
		else if(notebookId) {
			Notebook.expandNotebookTo(notebookId);
			Notebook.changeNotebook(notebookId, false, state.CurNoteId);
		}

		this.recoverAfter();

	}
};

// note.html调用
// 实始化页面
// 判断是否登录
function initPage() {
	win.on('close', function() {
		// 先保存之前改变的
		Note.curChangedSaveIt();
		// 保存状态
		State.saveCurState(function() {
			win.close(true);
		});
	});

	win.on('focus', function() {
		$('body').removeClass('blur');
	});
	win.on('blur', function() {
		$('body').addClass('blur');
	});

	// 注入前端变量#
	WebService.set(Notebook, Note, Attach, Tag);

	// 在显示notebooks, stars, tags后才recoverState
	var i = 0;
	function ok() {
		i++;
		if(i == 3) {
			State.recoverState(UserInfo);
		}
	}

	function _init() {
		$(function() {
			// 获取笔记本
			Service.notebookService.getNotebooks(function(notebooks) {
				log(notebooks);
				Notebook.renderNotebooks(notebooks);
				ok();
			});

			// 获得笔记
			Service.noteService.getNotes('', function(notes) {
				Note.renderNotesAndFirstOneContent(notes);
				if(!curNotebookId) {
					Notebook.selectNotebook($(tt('#notebook [notebookId="?"]', Notebook.allNotebookId)));
				}
			});
			// 获取star笔记
			NoteService.getStarNotes(function(notes) {
				Note.renderStars(notes);
				ok();
			});

			// 指定笔记, 也要保存最新笔记
			if(latestNotes.length > 0) {
				for(var i = 0; i < latestNotes.length; ++i) {
					Note.addNoteCache(latestNotes[i]);
				}
			}
			
			// 标签
			TagService.getTags(function(tags) {
				Tag.renderTagNav(tags);
				ok();
			});

			// init notebook后才调用
			// initSlimScroll();
			LeaAce.handleEvent();
		});
	};

	// 判断是否登录
	UserService.init(function(userInfo) {
		if(userInfo) {
			UserInfo = userInfo;
			// 之前已同步过, 就不要full sync了
			if('LastSyncUsn' in UserInfo && UserInfo['LastSyncUsn'] > 0) {
				_init();
	 		} else {
				fullSync(function() {
					_init();
				});
	 		}
	 		$('#username').text(UserInfo.Email);
	 		userMenu();
	 		setLayoutWidth();
		} else {
			switchAccount();
			// location.href = 'login.html';
		}
	});
}

// 初始bind事件上传图片
// tinymce, markdown触发之
function initUploadImage() {
	$('#chooseImageInput').change(function() {
		var $this = $(this);
		var imagePath = $this.val();
		$this.val('');

		var imagePaths = imagePath.split(';'); // 一次性可上传多张图片
		for(var i = 0; i < imagePaths.length; ++i) {
			(function(k) {
				var imagePath = imagePaths[k];
				// 上传之
				FileService.uploadImage(imagePath, function(newImage, msg) {
					if(newImage) {
						var note = Note.getCurNote();
						var url = EvtService.getImageLocalUrl(newImage.FileId);
						if(!note.IsMarkdown) {
							tinymce.activeEditor.insertContent('<img src="' + url + '">');
						} else {
							// TODO markdown insert Image
							MD.insertLink(url, '', true);
						}
					} else {
						alert(msg || "error");
					}
				});
			})(i);
		}

	});
}

// 改变css
var themes = {"Simple":'simple-no.css', 'Blue': 'blue.css', 'Black': 'black.css'};
var themeMenus = {};
function changeTheme(themeName) {
	if(themeName) {
		if(themeMenus[themeName]) {
			themeMenus[themeName].checked = true;
		}
		var css = themes[themeName];
		if(css) {
			$('#theme').attr('href', 'public/css/theme/' + css);

			// 保存
			UserService.updateG({Theme: themeName});
		}

	} else {
		themeMenus['Simple'].checked = true;
	}
}

// 演示模式, 全屏模式
var Pren = {

	_isFullscreen: false,
	_isPren: false,

	// 全局菜单
	pren: null,
	fullScreen: null,

	presentationO: $('#presentation'),

	toggleFullscreen: function() {
		var me = this;
		win.toggleFullscreen();
		me._isFullscreen = !me._isFullscreen;
		if(me._isFullscreen) {
			me.pren.enabled = false;
		} else {
			me.pren.enabled = true;
		}
	},
	togglePren: function() {
		var me = this;
		try {
			win.toggleKioskMode();
		} catch(e) {}

		if(!me._isPren) {
			$('.pren-title').html($('#noteTitle').val());
			var note = Note.getCurNote();
			$('.pren-content').html('');
			if(note) {
				var content = getEditorContent(note.IsMarkdown);
				var contentStr = content;
				if(typeof content == 'object') { // markdown
					contentStr = content[1];
				}
				$('.pren-content').html(contentStr);
			}

			$('#themePresentation').attr('disabled', false);

			$('body').addClass('no-drag');
			$('#page').hide();
			me._isPren = true;

			// 代码高亮
			$(".pren-content pre").addClass("prettyprint linenums");
			prettyPrint();

		} else {
			$('#themePresentation').attr('disabled', true);
			me._isPren = false;
			$('body').removeClass('no-drag');
			$('#page').show();
			me.restore();
		}

		if(me._isPren) {
			me.fullScreen.enabled = false;
		} else {
			me.fullScreen.enabled = true;
		}
	},

	// 恢复, 为了下次显示
	restore: function() {
		var me = this;
		me.presentationO.scrollTop(0);

	},
	
	_themeMode: 'normal', // 当前背景颜色模式, 三种, normal, writting, black

	toggleThemeMode: function() {
		var me = this;
		if(me._themeMode == 'normal') {
			me.presentationO.addClass('writting');
			me._themeMode = 'writting';
		} else if(me._themeMode == 'writting') {
			me.presentationO.removeClass('writting').addClass('black');
			me._themeMode = 'black';
		} else {
			me.presentationO.removeClass('black');
			me._themeMode = 'normal';
		}
	},

	_fontSizeIndex: 2, // 位置
	_fontScales: ['text-min-2', 'text-min-1', '', 'text-max-1', 'text-max-2'],
	toggleFontSizeMode: function(isMin) {
		var me = this;
		var curClass = me._fontScales[me._fontSizeIndex];

		if(isMin) {
			if(me._fontSizeIndex > 0) {
				me._fontSizeIndex--;
			}
		} else {
			if(me._fontSizeIndex < 4) {
				me._fontSizeIndex++;
			}
		}

		var nextClass = me._fontScales[me._fontSizeIndex];
		if(curClass != nextClass) {
			me.presentationO.removeClass(curClass).addClass(nextClass);
		}
	},

	init: function() {
		var me = this;
		// 初始化menu
		me.fullScreen = new gui.MenuItem(
			{label: 'Toggle Fullscreen', click: function() {
				me.toggleFullscreen();
			}
		});
		me.pren = new gui.MenuItem(
			{label: 'Toggle Presentation', click: function() {
				me.togglePren();
			}
		});
	
		// Esc
		$("body").on('keydown', function(e) {
			if(e.keyCode == 27) {
				if(me._isPren) {
					me.togglePren();
				} else if(me._isFullscreen) {
					me.toggleFullscreen();
				}
			}
		});


		function isURL(str_url) {
		    var re = new RegExp("^((https|http|ftp|rtsp|mms|emailto)://).+");
		    return re.test(str_url);
		}
		
		// 防止在本窗口打开
		me.presentationO.on('click', 'a', function(e) {
			e.preventDefault();
			var href = $(this).attr('href');
			if(href && href.indexOf('http://127.0.0.1') < 0 && isURL(href)) {
				openExternal(href);
			}
		});

		$('.pren-tool-close').click(function() {
			me.togglePren();
		});

		$('.pren-tool-bg-color').click(function() {
			me.toggleThemeMode();
		});
		$('.pren-tool-text-size-min').click(function() {
			me.toggleFontSizeMode(true);
		});
		$('.pren-tool-text-size-max').click(function() {
			me.toggleFontSizeMode(false);
		});
	}
};

// 升级
function checkForUpdates() {
	if(Upgrade.checkForUpdates) {
		Upgrade.checkForUpdates();
	}
};


// user
function userMenu() {
	// ----------
	// 全局菜单

	var mode = new gui.Menu();

	Pren.init();
	
	mode.append(Pren.pren);
	mode.append(Pren.fullScreen);
	var modes = new gui.MenuItem({ label: 'Mode', submenu: mode});
	if(isMac()) {
		var nativeMenuBar = new gui.Menu({ type: "menubar" });
		nativeMenuBar.createMacBuiltin("Leanote");
		win.menu = nativeMenuBar;
		win.menu.append(modes);
	}
	// windows和linux下就用user's menu来代替
	else {
		// alert(process.platform);
		// win.menu.append(modes);
	}

	//-------------------
	// 右键菜单
	function menu() {
		var me = this;
		// this.target = '';
		UserInfo.Host = UserInfo.Host || 'http://leanote.com';
		var shortHost = UserInfo.Host;
		var ret = /http(s*):\/\/([a-zA-Z0-9\.\-]+)/.exec(shortHost);
		if(ret && ret.length == 3) {
			shortHost = ret[2];
		}

	    this.menu = new gui.Menu();
	    this.email = new gui.MenuItem({
	        label: UserInfo.Email + ' (' + shortHost + ')',
	        enabled: false,
	        click: function(e) {
	        }
	    });
	    this.blog = new gui.MenuItem({
	        label: 'My blog',
	        click: function(e) {
	        	openExternal(UserInfo.Host + '/blog/' + UserInfo.UserId);
	        }
	    });
	    this.switchAccount = new gui.MenuItem({
	        label: 'Switch account',
	        click: function(e) {
	        	// window.open('login.html');
	        	// win.close();
	        	// 
	        	switchAccount();
	        	// 这样, 不能window.open(), 不然needle有问题
	        	// 可以gui.Window.open();
	        	// location.href = 'login.html';
	        }
	    });
	    this.theme = new gui.MenuItem({
	        label: 'Change theme',
	        click: function(e) {
	        }
	    });
	    this.sync = new gui.MenuItem({
	        label: 'Sync now',
	        click: function(e) {
	        	incrSync();
	        }
	    });
	    this.checkForUpdates = new gui.MenuItem({
	        label: 'Check for updates',
	        click: function(e) {
	        	checkForUpdates();
	        }
	    });

	    var themeSubmenus = new gui.Menu();
	    for(var i in themes) {
	    	(function(t) {
				themeMenus[t] = new gui.MenuItem({
			        label: t,
			        type: 'checkbox',
			        click: function(e) {
			        	// var themeCss = themes[t];
			        	changeTheme(t);
			        	// 将其它的不选中
			        	for(var j in themes) {
			        		if(j != t) {
			        			themeMenus[j].checked = false;
			        		}
			        	}
			        }
			    });
			    themeSubmenus.append(themeMenus[t]);
	    	})(i);
	    }
	    this.theme.submenu = themeSubmenus;

	    this.menu.append(this.email);
	    this.menu.append(this.blog);
	    this.menu.append(this.switchAccount);
	    this.menu.append(new gui.MenuItem({ type: 'separator' }));
	    this.menu.append(this.theme);
		
		var height = 180;
		if(!isMac()) {
			this.menu.append(new gui.MenuItem({ type: 'separator' }));

			this.menu.append(Pren.pren);
			this.menu.append(Pren.fullScreen);
			/*
			this.menu.append(new gui.MenuItem(
			{label: 'Toggle Presentation', click: function() {
				// me.togglePren();
			}
			}));
			*/
			height = 270;
		}

	    this.menu.append(new gui.MenuItem({ type: 'separator' }));
	    this.menu.append(this.checkForUpdates);

	    this.menu.append(new gui.MenuItem({ type: 'separator' }));
	    this.menu.append(this.sync);
		
	    this.popup = function(e) {
			this.menu.popup(10, $('body').height() - height);
	    }
	}

	var userMenuSys = new menu();

	$('#myProfile').click(function(e) {
		userMenuSys.popup(e);
	});

	// 修改主题
	changeTheme(UserInfo.Theme);
	
	// disable drag & drop
	document.body.addEventListener('dragover', function(e){
	  e.preventDefault();
	  e.stopPropagation();
	}, false);
	document.body.addEventListener('drop', function(e){
	  e.preventDefault();
	  e.stopPropagation();
	}, false);
}

$(function() {
	initUploadImage();
	Writting.init();
});

