package news

type Item struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	SortOrder   int    `json:"sortOrder"`
	PublishedAt string `json:"publishedAt,omitempty"`
	CreatedAt   string `json:"createdAt,omitempty"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
}

type Catalog struct {
	Items      []Item `json:"items"`
	TotalCount int    `json:"totalCount"`
	Offset     int    `json:"offset"`
	Limit      int    `json:"limit"`
}
