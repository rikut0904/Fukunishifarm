package grape

func DefaultCatalog() Catalog {
	return Catalog{
		Items: []Item{
			{
				Name:        "竜宝",
				ImagePath:   "/img/ryuhou.jpeg",
				ImageFocus:  "center 40%",
				ImageScale:  100,
				Description: "大粒で薄赤紫色。とろけるような甘さが特徴であり、ジューシーで触感の良い品種です。房から粒が取れやすいため輸送には不向きなため、現地でのみの販売です。",
				SaleStatus:  SaleStatusPreparing,
			},
			{
				Name:        "シナノスマイル",
				ImagePath:   "/img/shinano.jpeg",
				ImageFocus:  "center 38%",
				ImageScale:  100,
				Description: "酸味と甘未のバランスがちょうどよく、すっきりとした味わいが人気の品種です。",
				SaleStatus:  SaleStatusPreparing,
			},
			{
				Name:        "藤稔",
				ImagePath:   "/img/fujiminori.jpeg",
				ImageFocus:  "center 32%",
				ImageScale:  100,
				Description: "糖度が高く酸味、渋みが少ないのが特徴の品種です。適度な酸味と十分な甘みが口中に広がる贅沢な味です。",
				SaleStatus:  SaleStatusPreparing,
			},
			{
				Name:        "ピオーネ",
				ImagePath:   "/img/pione.jpeg",
				ImageFocus:  "center 44%",
				ImageScale:  100,
				Description: "糖度が高くて香りもよく、適度な酸味で濃厚な味わいが人気の品種です。",
				SaleStatus:  SaleStatusPreparing,
			},
			{
				Name:        "シャインマスカット",
				ImagePath:   "/img/syain.jpeg",
				ImageFocus:  "center 35%",
				ImageScale:  100,
				Description: "種なしで皮ごと食べられ、さわやかでジューシー、酸味も低く贅沢な甘さが大人気！肉質は少し片目で、プリプリとした触感が楽しめます。",
				SaleStatus:  SaleStatusPreparing,
			},
		},
	}
}
