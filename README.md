# js-mailbox

Javascript one page mail box applicatoion.

## Mailbox features
- System of folders
- List of messages
- Read a message
- Filters over message list (readed, favourited, priority)
- And one simle chart
- Search in downloaded messages
- Message counts by priority
- Highlighting of unread and urgent messages

## Uses
- Twitter Bootstrap
- JQuery
- Chartist.js

## Installation

- Download source files

> git clone https://github.com/dimichspb/js-mailbox

- Install dependencies

> bower install
	
- Enjoy


## API documentation

### GET /api/folders
Returns collection of user's folders

### GET /api/messages
Returns collection of messages

#### Params
> ?folder=(id)

    Filters messages by ID

### PUT /api/messages/(id integer)
Sets new message params. You need to send new version on object, not only changed parameters.

### DELETE /api/messages/(id integer)
Deletes a message.
