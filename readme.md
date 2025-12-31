# TNAPRO ( Powered By MMCSB )

This is a documentation file prepared to help with the current and future development of the system. This file act as a reference and guide on how to use each of the API provided.

# GRADE

API to create, read, update and delete grade.

## Create

> **API** : https://[your-url]/api/grade
> **Method** : POST
> **Header** : Authorization Bearer {token}
> **Body Content (JSON)** : `{ id: MM0001, name: Hanif Ismail, positionid: 21}`

## Read (ALL)

> **API** : https://[your-url]/api/grade
> **Parameter** : None
> **Method** : GET
> **Header** : Authorization Bearer {token}
> **Body Content (JSON)** : None
> **Output Example** : `{ id: MM0001, name: Hanif Ismail, positionid: 21}`

## Read (Unique)

> **API** : https://[your-url]/api/grade/:id
> **Parameter** : id (eg. 1,2,3)
> **Method** : GET
> **Header** : Authorization Bearer {token}
> **Body Content (JSON)** : None
> **Output Example** : `{ id: MM0001, name: Hanif Ismail, positionid: 21}`

## Update

You can rename the current file by clicking the file name in the navigation bar or by clicking the **Rename** button in the file explorer.

## Delete

You can delete the current file by clicking the **Remove** button in the file explorer. The file will be moved into the **Trash** folder and automatically deleted after 7 days of inactivity.

## Export a file

You can export the current file by clicking **Export to disk** in the menu. You can choose to export the file as plain Markdown, as HTML using a Handlebars template or as a PDF.