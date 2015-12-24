const APIurl = "http://guess.dev.altworx.com";
const APIgetFolders = "/api/folders";
const APIgetMessages = "/api/messages";
const APIputMessage = "/api/messages/";
const APIdeleteMessage = "/api/messages/";

function Filter(filterName,
                filterValue)
{
    this.name = filterName;
    this.value = filterValue;
}


function Priority(priorityOrder,
                  priorityClass)
{
    this.order = priorityOrder;
    this.class = priorityClass;
}

function message(messageBody,
                 messageId,
                 messageIsFavaourited,
                 messageIsOpen,
                 messagePriority,
                 messageSendDate,
                 messageSender,
                 messageSubject)
{

    this.body = messageBody;
    this.id = messageId;
    this.isFavourited = messageIsFavaourited;
    this.isOpen = messageIsOpen;
    this.priority = messagePriority;
    this.sendDate = messageSendDate;
    this.sender = messageSender;
    this.subject = messageSubject;
}

var filters = [];

var priority = {
    'low': new Priority(0, 'label-info'),
    'high': new Priority(1, 'label-warning'),
    'urgent': new Priority(2, 'label-danger')
};

var messagesList = $("#messages-list");
var foldersList = $("#folders-list");
var filterForm = $("#filter-form");
var filterInputs = $("[data-filter-name]");
var searchField = $("#search-message-field");


function getFoldersFromAPI() {
    $.getJSON( APIurl + APIgetFolders)
        .done(function(json) {
            setFolders(json);
        })
        .fail(function( jqXHR, textStatus, error ) {
            alert( "Request to folders API failed: " + textStatus + "," + error);
        });
}

function getMessagesByFolderIdFromAPI(folderId) {
    $.getJSON( APIurl + APIgetMessages, {
        'folder': folderId
    })
        .done(function(json){
            setMessages(json);
        })
        .fail(function( jqXHR, textStatus, error ) {
            alert( "Request to messages API failed: " + textStatus + "," + error);
        });
}

function putMessageToAPI(messageIndex) {
    var message = getMessageFromStorage(messageIndex);
/*
    $.ajax({
        url: APIurl + APIputMessage + message.id,
        type: 'PUT',
        crossDomain: true,
        data: message
    })
        .done(function(json) {
            console.log("put done");
        });
*/
}

function deleteMessageFromAPI(messageIndex) {
    var message = getMessageFromStorage(messageIndex);
/*
    $.ajax({
            url: APIurl + APIdeleteMessage + message.id,
            type: 'DELETE',
            crossDomain: true
        })
        .done(function(json) {
            console.log("delete done");
        });
*/
}

function setFolders(json) {
//    console.log(json.folders);

    var folders = json.folders;

    folders.sort(function(a, b) {
        if (a.order >= b.order)
            return 1;
        else
            return -1;
    });

    if(typeof(Storage) !== "undefined") {
        saveFoldersToStorage(folders);
        showFolders();
        setActiveFolder(0);
    } else {
        alert('Sorry, your browser is too old');
    }
}

function setMessages(json){
//    console.log(json);

    var messages = json.messages;

    messages.sort(function(a, b) {
        if (priority[a.priority].order <= priority[b.priority].order)
            return 1;
        else
            return -1;
    });

    if(typeof(Storage) !== "undefined") {
        saveMessagesToStorage(messages);
        showMessages();
    } else {
        alert('Sorry, your browser is too old');
    }
}

function folderItemRender(folderItem, i) {
    return (
        $("<li>").append(
            $("<a>")
                .attr('href', '#')
                .addClass(folderItem.isOpen !== true? 'bold':'')
                .append(folderItem.name + "  ")
                .append(
                    $("<span>")
                        .addClass('badge')
                        .append(folderItem.messageCount)
                )
            )
            .attr('data-folder-id', folderItem.id)
            .attr('data-folder-name', folderItem.name)
    );
}

function messageItemRender(messageItem, i) {

    var messageFilterFlag = filterMessage(messageItem);

    return (
        $("<a>")
            .attr('href', '#')
            .attr('data-message-index', i)
            .addClass(messageFilterFlag? '': 'hidden')
            .addClass('list-group-item')
            .append(
                $("<div>")
                    .addClass('row')
                    .append(
                        $("<div>")
                            .addClass('col-sm-1')
                            .append(
                                $("<span>")
                                    .addClass('favourite')
                                    .addClass(messageItem.isFavourited === true? 'glyphicon glyphicon-star': 'glyphicon glyphicon-star-empty')
                            )
                    )
                    .append(
                        $("<div>")
                            .addClass('col-sm-7')
                            .addClass(messageItem.isOpen !== true? 'bold':'')
                            .append(
                                $("<h4>")
                                    .addClass('list-group-item-heading')
                                    .append(messageItem.sender)
                            )
                            .append(
                                $("<p>")
                                    .addClass('list-group-item-text')
                                    .append(messageItem.subject)
                            )
                    )
                    .append(
                        $("<div>")
                            .addClass('col-sm-2')
                            .append(
                                $("<p>")
                                    .addClass('list-group-item-text')
                                    .append(convertDate(messageItem.sendDate))
                            )
                    )
                    .append(
                        $("<div>")
                            .addClass('col-sm-1')
                            .append(
                                $("<span>")
                                    .addClass('label')
                                    .addClass('label-pill')
                                    .addClass(priority[messageItem.priority].class)
                                    .append(messageItem.priority)
                            )
                    )
                    .append(
                        $("<div>")
                            .addClass('col-sm-1')
                            .append(
                                $("<span>")
                                    .addClass('delete')
                                    .addClass('glyphicon glyphicon-trash')
                            )
                    )
            )
    );
}

function showFolders() {

    var folders = getFoldersFromStorage();

    foldersList.empty();

    folders.forEach(function(folderItem, i, arr) {
        if (folderItem) {
            foldersList.append(
                folderItemRender(folderItem, i)
            )
        }
    });
}

function showMessages() {
    var messages = getMessagesFromStorage();

    setFilters();
    messagesList.empty();

    messages.forEach(function(messageItem, i, messagesArray) {
        if (messageItem) {
            messagesList.append(
                messageItemRender(messageItem, i)
            )
        }
    });
}


function setActiveFolder(activeFolderIndex) {
    var foldersListLiList = foldersList.find("li");
    var activeFolder = foldersListLiList.eq(activeFolderIndex);
    var activeFolderId = activeFolder.data('folder-id');
    var activeFolderName = activeFolder.data('folder-name');

    foldersListLiList.removeClass('active');
    activeFolder.addClass('active');

    $("#active-folder-name").text(activeFolderName);

    getMessagesByFolderIdFromAPI(activeFolderId);
}

function convertDate(dateString) {
    var date = new Date(dateString);
    return date.getFullYear() + '-' + (parseInt(date.getMonth())+1) + '-' + date.getDate();
}

function getMessageFromStorage(messageIndex) {
    var messages = getMessagesFromStorage();
    return messages[messageIndex];
}

function saveMessageToStorage(message, messageIndex) {
    var messages = getMessagesFromStorage();
    messages[messageIndex] = message;
    sessionStorage.setItem('messages', JSON.stringify(messages));
}

function getMessagesFromStorage() {
    return $.parseJSON(sessionStorage.getItem('messages'));
}

function saveMessagesToStorage(messages) {
    sessionStorage.setItem('messages', JSON.stringify(messages));
}

function getFoldersFromStorage() {
    return $.parseJSON(sessionStorage.getItem('folders'));
}

function saveFoldersToStorage(folders) {
    sessionStorage.setItem('folders', JSON.stringify(folders));
}

function toggleMessageAttribute(messageIndex, attributeName, toggleFlag) {
    var message = getMessageFromStorage(messageIndex);

    if (toggleFlag == undefined) {
        message[attributeName] = !message[attributeName];
    } else {
        message[attributeName] = toggleFlag;
    }

    saveMessageToStorage(message, messageIndex);
}

function deleteMessageFromStorage(messageIndex) {
    var messages = getMessagesFromStorage();
    delete messages[messageIndex];

    saveMessagesToStorage(messages);
}

function updateMessageNode(messageIndex) {
    var currentMessageNode = getMessageNode(messageIndex);

    var message = getMessageFromStorage(messageIndex);
    var newMessageNode = messageItemRender(message, messageIndex);

    currentMessageNode.replaceWith(newMessageNode);
}

function removeMessageNode(messageIndex) {
    var currentMessageNode = getMessageNode(messageIndex);

    currentMessageNode.remove();
}

function getMessageNode(messageIndex) {
    var messagesListAList = messagesList.find("a");
    return messagesListAList.filter(function(){
        return $(this).data('message-index') === messageIndex
    });
}

function favouriteMessage(messageIndex) {
    toggleMessageAttribute(messageIndex, 'isFavourited');
    putMessageToAPI(messageIndex);
    updateMessageNode(messageIndex);
}

function deleteMessage(messageIndex) {
    deleteMessageFromAPI(messageIndex);
    deleteMessageFromStorage(messageIndex);
    removeMessageNode(messageIndex);
}

function openMessage(messageIndex) {
    openMessageModal(messageIndex);
    toggleMessageAttribute(messageIndex, 'isOpen', true);
    putMessageToAPI(messageIndex);
    updateMessageNode(messageIndex);
}

function openMessageModal(messageIndex) {
    var message = getMessageFromStorage(messageIndex);
    var messageModal = $("#messageModal");

    messageModal.find(".message-subject").text(message.subject);
    messageModal.find(".message-sender").text(message.sender);
    messageModal.find(".message-date").text(message.sendDate);
    messageModal.find(".message-body").text(message.body);

    messageModal.modal();
}

function filterMessage(message) {

    var result = true;

    filters.forEach(function(filterItem) {
        if ((message[filterItem.name] !== filterItem.value)  && filterItem.value !=='all') result = false;
    });

    var searchString = searchField[0].value;

    if (searchString !== '') {
        if (message.sender.toLowerCase().indexOf(searchString.toLowerCase()) < 0 &&
            message.subject.toLowerCase().indexOf(searchString.toLowerCase()) < 0 &&
            message.body.toLowerCase().indexOf(searchString.toLowerCase()) < 0) {

            result = false;
        }
    }

    return result;
}

function setFilters() {
    filters = [];

    filterInputs.each(function() {
        var filterInput = $(this);

        if (filterInput[0].checked) {

            var filter = new Filter();
            filter.name  = filterInput.data('filter-name');
            filter.value = filterInput.data('filter-value');

            filters.push(filter);
        }
    });
}


foldersList.on('click', 'li>a', function(e) {
    setActiveFolder($(this).parent().index());
    return false;
});

messagesList.on('click', 'a', function(e) {
    var messageIndex = $(this).data('message-index');

    if ($(e.target).is('.favourite')) {
        favouriteMessage(messageIndex);
    } else if ($(e.target).is('.delete')) {
        deleteMessage(messageIndex);
    } else {
        openMessage(messageIndex);
    }
    return false;
});

filterForm.on('submit', function() {
    showMessages();
    return false;
});

filterForm.find("input[type=radio]").on('change', function() {
    showMessages();
});

$(document).ready(function() {
    getFoldersFromAPI();
});
