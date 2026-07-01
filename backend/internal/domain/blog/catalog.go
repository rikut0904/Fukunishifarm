package blog

type Image struct {
	URL    string `json:"url"`
	Height int    `json:"height,omitempty"`
	Width  int    `json:"width,omitempty"`
}

type Category struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Post struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Excerpt     string    `json:"excerpt"`
	Content     string    `json:"content"`
	Eyecatch    *Image    `json:"eyecatch,omitempty"`
	Category    *Category `json:"category,omitempty"`
	PublishedAt string    `json:"publishedAt"`
	RevisedAt   string    `json:"revisedAt,omitempty"`
	CreatedAt   string    `json:"createdAt,omitempty"`
	UpdatedAt   string    `json:"updatedAt,omitempty"`
}

type Catalog struct {
	Posts []Post `json:"posts"`
}
