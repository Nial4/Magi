package controller

import (
	"context"
	"fmt"
	"log"
	"magi/env"

	"github.com/labstack/echo/v4"
	"github.com/sashabaranov/go-openai"
)

// MagiController
type MagiController struct {
}

func NewMagiController() *MagiController {
	return &MagiController{}
}

// HomeController
func (mc *MagiController) Home(c echo.Context) error {

	results := make(chan string, 3)

	go func() { results <- makeDecision(env.MELCHIOR_start) }()
	go func() { results <- makeDecision(env.CASPAR_start) }()
	go func() { results <- makeDecision(env.BALTHASAR_start) }()

	result1 := <-results
	result2 := <-results
	result3 := <-results

	return c.String(200, result1+"\n"+result2+"\n"+result3)
}

func makeDecision(role string) string {
	client := openai.NewClient(env.OPENAI_Key)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: role,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Hi gpt, say yes or no?",
				},
			},
		},
	)

	if err != nil {
		fmt.Printf("ChatCompletion error: %v\n", err)
		return "nil"
	}

	log.Println(resp.Choices[0].Message.Content)

	return resp.Choices[0].Message.Content
}
