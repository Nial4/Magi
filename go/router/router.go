package router

import (
	"magi/controller"

	"github.com/labstack/echo/v4"
)

func InitRouter(mc *controller.MagiController) *echo.Echo {
	e := echo.New()
	e.GET("/", mc.Home)

	// RESTful API
	api := e.Group("/api")
	api.GET("/", mc.Home)

	return e
}
