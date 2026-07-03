package auth

type LoginResult struct {
	VerifiedIdentity
	IDToken string
}
