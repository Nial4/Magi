package main

import (
	"fmt"
	"magi/controller"
	"magi/router"
)

func main() {
	address := "localhost:1323"

	magiController := controller.NewMagiController()
	e := router.InitRouter(magiController)

	fmt.Printf("Server started at %s \n", address)
	e.Logger.Fatal(e.Start(address))
}
