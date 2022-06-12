# Práctica 3

REST API for coworking space with 20 seats. Database hosted in MongoDB

Endpoint | Description
--- | ---
GET **/status** | Shows server status
POST **/register** | User register
POST **/login** | User log in
POST **/logout** | User log out
GET **/freeseats** | Shows free seats
POST **/book** | Book one seat
POST **/free** | Free one seat
GET **/mybookings** | Shows future bookings from logged in user