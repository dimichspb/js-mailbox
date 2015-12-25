/**
 * Javascript one page mailbox application
 *
 * @author Dmitry Tarantin <dimichspb@gmail.com>
 */


// Constants declaration block

const APIurl = "http://guess.dev.altworx.com";
const APIgetFolders = "/api/folders";
const APIgetMessages = "/api/messages";
const APIputMessage = "/api/messages/";
const APIdeleteMessage = "/api/messages/";


// Objects declaration block


/**
 * Filter object used to set filters for messages listing
 *
 * @param filterName
 * @param filterValue
 * @constructor
 */

function Filter(filterName,
                filterValue)
{
    this.name = filterName;
    this.value = filterValue;
}


/**
 * Priority object used to specify order and element class for each type of priority for sorting and rendering
 * message elements reasons
 *
 * @param priorityOrder
 * @param priorityClass
 * @constructor
 */

function Priority(priorityOrder,
                  priorityClass)
{
    this.order = priorityOrder;
    this.class = priorityClass;
}


/**
 * Message object specifies message's attributes we get from API. We don't use this object actually and it is specified
 * here only to know message better.
 *
 * @param messageBody
 * @param messageId
 * @param messageIsFavourited
 * @param messageIsOpen
 * @param messagePriority
 * @param messageSendDate
 * @param messageSender
 * @param messageSubject
 */

function message(messageBody,
                 messageId,
                 messageIsFavourited,
                 messageIsOpen,
                 messagePriority,
                 messageSendDate,
                 messageSender,
                 messageSubject)
{

    this.body = messageBody;
    this.id = messageId;
    this.isFavourited = messageIsFavourited;
    this.isOpen = messageIsOpen;
    this.priority = messagePriority;
    this.sendDate = messageSendDate;
    this.sender = messageSender;
    this.subject = messageSubject;
}

// Global variables declaration block

/**
 * Variable filters used to store all filter objects
 *
 * @type {Array}
 */

var filters = [];

/**
 * Object priority used to store the list of all possible priority attribute values
 *
 * @type {{low: Priority, high: Priority, urgent: Priority}}
 */

var priority = {
    'low': new Priority(0, 'label-info'),
    'high': new Priority(1, 'label-warning'),
    'urgent': new Priority(2, 'label-danger')
};

// JQuery HTML elements variables declaration block

var messagesList = $("#messages-list"); // the list of the message nodes container
var foldersList = $("#folders-list"); // the list of folder nodes container
var filterForm = $("#filter-form"); // filters form node
var filterInputs = $("[data-filter-name]"); // the list of all filter inputs
var searchField = $("#search-message-field"); // search input field

// API working functions block


/**
 * Sends GET request to API and gets JSON with folders list from server
 *
 * runs setFolders() function to show and store folders if request done well and
 * alerts user if it fails
 *
 */
function getFoldersFromAPI() {
    $.getJSON( APIurl + APIgetFolders)
        .done(function(json) {
            setFolders(json);
        })
        .fail(function( jqXHR, textStatus, error ) {
            alert( "Request to folders API failed: " + textStatus + "," + error);
        });
}

/**
 * Sends GET request with specified parameter folder to API and gets JSON with messages list of the folder from server
 *
 * runs setMessages() function to show and store messages if request done well and
 * alerts user if it fails
 *
 * @param folderId
 */
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

/**
 * Send PUT request to API with message object and message's id specified
 *
 * TODO: current version of API doesn't allow cross domain requests.
 * TODO: The function's body has been commented until the issue is fixed
 * TODO: message ID parameter is specified as Integer in original Task, but API returns string value
 *
 * @param messageIndex Using storage index of message we need to send to server
 */

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

/**
 * Send DELETE request to API with message object and message's id specified
 *
 * TODO: current version of API doesn't allow cross domain requests.
 * TODO: The function's body has been commented until the issue is fixed
 * TODO: message ID parameter is specified as Integer in original Task, but API returns string value
 *
 * @param messageIndex
 */

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

// API results working functions block

/**
 * Gets folders JSON object we have from API, sorts it by Order field and in case we have browser which allows to store
 * objects in Storage do the jobs - save folders to storage, show folders on page, set active folder to first element.
 *
 * Alarms user if browser has no Storage feature
 *
 * @param json
 */

function setFolders(json) {
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

/**
 * Gets messages JSON object we have from API, sorts it by Priority field (using attribute Order of Priority object)
 * and in case we have browser which allows to store objects in Storage do the jobs - save messages to storage,
 * show messages on the page.
 *
 * Alarms user if browser has no Storage feature
 *
 * @param json
 */

function setMessages(json){
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

// Message working functions block

/**
 * Toggles the attribute of the message in Storage. Attribute is specified by Name, message is specified by Index
 *
 * @param messageIndex
 * @param attributeName
 * @param toggleFlag if specified the value will be assigned to the attribute, and attribute value will be toggled to
 *                   opposite otherwise.
 */

function toggleMessageAttribute(messageIndex, attributeName, toggleFlag) {
    var message = getMessageFromStorage(messageIndex);

    if (toggleFlag == undefined) {
        message[attributeName] = !message[attributeName];
    } else {
        message[attributeName] = toggleFlag;
    }

    saveMessageToStorage(message, messageIndex);
}

/**
 * Marks the message as Favourited or not - toggle isFavourited attribute of the message in Storage, puts the updated
 * object to API, updates message's node in HTML DOM
 *
 * @param messageIndex
 */

function favouriteMessage(messageIndex) {
    toggleMessageAttribute(messageIndex, 'isFavourited');
    putMessageToAPI(messageIndex);
    updateMessageNode(messageIndex);
}

/**
 * Deletes message - deletes message from API, deletes message from Storage, removes message node from HTML DOM
 *
 * @param messageIndex
 */

function deleteMessage(messageIndex) {
    deleteMessageFromAPI(messageIndex);
    deleteMessageFromStorage(messageIndex);
    removeMessageNode(messageIndex);
}

/**
 * Opens message - opens message Modal window, toggles message's isOpen attribute to true, puts updates message to API,
 * updates message's node in HTML DOM
 *
 * @param messageIndex
 */

function openMessage(messageIndex) {
    openMessageModal(messageIndex);
    toggleMessageAttribute(messageIndex, 'isOpen', true);
    putMessageToAPI(messageIndex);
    updateMessageNode(messageIndex);
}

// Storage working functions block

/**
 * Stores folders JSON to Storage's item folders
 *
 * @param folders
 */

function saveFoldersToStorage(folders) {
    sessionStorage.setItem('folders', JSON.stringify(folders));
}

/**
 * Returns parsed folders JSON from Storage's item folders;
 *
 * @returns {*}
 */

function getFoldersFromStorage() {
    return $.parseJSON(sessionStorage.getItem('folders'));
}

/**
 * Stores messages JSON to Storage's item messages
 *
 * @param messages
 */

function saveMessagesToStorage(messages) {
    sessionStorage.setItem('messages', JSON.stringify(messages));
}

/**
 * Returns parsed messages JSON from Storage's item messages
 *
 * @returns {*}
 */

function getMessagesFromStorage() {
    return $.parseJSON(sessionStorage.getItem('messages'));
}


/**
 * Saves specified message into Storage with specified Index
 *
 * @param message
 * @param messageIndex
 */

function saveMessageToStorage(message, messageIndex) {
    var messages = getMessagesFromStorage();
    messages[messageIndex] = message;
    sessionStorage.setItem('messages', JSON.stringify(messages));
}

/**
 * Returns message with specified Index from Storage
 *
 * @param messageIndex
 * @returns {*}
 */

function getMessageFromStorage(messageIndex) {
    var messages = getMessagesFromStorage();
    return messages[messageIndex];
}

/**
 * Deletes message with specified Index from Storage
 *
 * @param messageIndex
 */

function deleteMessageFromStorage(messageIndex) {
    var messages = getMessagesFromStorage();
    delete messages[messageIndex];

    saveMessagesToStorage(messages);
}

// Showing functions block

/**
 * Adds all folders from Storage to HTML DOM using renderer function
 */

function showFolders() {
    var folders = getFoldersFromStorage();

    foldersList.empty(); // we have to empty the folders list container before adding new items

    folders.forEach(function(folderItem, i, foldersArray) {
        if (folderItem) {
            foldersList.append(
                folderItemRender(folderItem, i)
            )
        }
    });
}

/**
 * Adds all messages from Storage to HTML DOM using renderer function
 */

function showMessages() {
    var messages = getMessagesFromStorage();

    setFilters(); // set filters
    messagesList.empty(); // we have to empty the messages list container before adding new items

    messages.forEach(function(messageItem, i, messagesArray) {
        if (messageItem) {
            messagesList.append(
                messageItemRender(messageItem, i)
            )
        }
    });
}

// Folder and message renderers block

/**
 * Folder node renderer function
 *
 * @param folderItem
 * @param i
 * @returns {*|jQuery}
 */

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

/**
 * Message node renderer function
 *
 * @param messageItem
 * @param i
 * @returns {void|jQuery}
 */

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

// HTML DOM working functions block

/**
 * Adds active class to selected folder item and place its name to the header of messages list
 *
 * @param activeFolderIndex
 */

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

/**
 * Returns message node by Index
 *
 * @param messageIndex
 * @returns {Array.<T>|*}
 */

function getMessageNode(messageIndex) {
    var messagesListAList = messagesList.find("a");
    return messagesListAList.filter(function(){
        return $(this).data('message-index') === messageIndex;
    });
}

/**
 * Updates message node from Storage by Index
 *
 * @param messageIndex
 */

function updateMessageNode(messageIndex) {
    var currentMessageNode = getMessageNode(messageIndex);

    var message = getMessageFromStorage(messageIndex);
    var newMessageNode = messageItemRender(message, messageIndex);

    currentMessageNode.replaceWith(newMessageNode);
}

/**
 * Removes message node by Index
 *
 * @param messageIndex
 */

function removeMessageNode(messageIndex) {
    var currentMessageNode = getMessageNode(messageIndex);

    currentMessageNode.remove();
}

/**
 * Opens message Modal window
 *
 * @param messageIndex
 */

function openMessageModal(messageIndex) {
    var message = getMessageFromStorage(messageIndex);
    var messageModal = $("#messageModal");

    messageModal.find(".message-subject").text(message.subject);
    messageModal.find(".message-sender").text(message.sender);
    messageModal.find(".message-date").text(message.sendDate);
    messageModal.find(".message-body").text(message.body);

    messageModal.modal();
}

// Filter working functions block

/**
 * Set filters array depending on filter inputs
 */

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

/**
 * Returns false if specified message doesn't fall under the filters and true in other case
 *
 * @param message
 * @returns {boolean}
 */

function filterMessage(message) {
    var result = true;
    var searchString = searchField[0].value;

    filters.forEach(function(filterItem) {
        if ((message[filterItem.name] !== filterItem.value)  && filterItem.value !=='all') result = false;
    });

    if (searchString !== '') {
        if (message.sender.toLowerCase().indexOf(searchString.toLowerCase()) < 0 &&
            message.subject.toLowerCase().indexOf(searchString.toLowerCase()) < 0 &&
            message.body.toLowerCase().indexOf(searchString.toLowerCase()) < 0) {

            result = false;
        }
    }

    return result;
}

// Extra functions block

/**
 * Converts date to human format
 *
 * @param dateString
 * @returns {string}
 */

function convertDate(dateString) {
    var date = new Date(dateString);
    return date.getFullYear() + '-' + (parseInt(date.getMonth())+1) + '-' + date.getDate();
}

// JQuery events specification block


/**
 * Sets folder as active when clicked
 */

foldersList.on('click', 'li>a', function(e) {
    setActiveFolder($(this).parent().index());
    return false;
});

/**
 * Runs the specific function depending on clicked area of message node:
 * - toggle isFavourite attribute if clicked on star
 * - delete message if clicked on trash
 * - open message Modal in other cases
 */

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

/**
 * Updates messages list on filters form submit
 */

filterForm.on('submit', function() {
    showMessages();
    return false;
});

/**
 * Updates messages list on filter inputs change
 */

filterForm.find("input[type=radio]").on('change', function() {
    showMessages();
});

/**
 * Runs getting folders from API when Document is ready
 */

$(document).ready(function() {
    getFoldersFromAPI();
});
