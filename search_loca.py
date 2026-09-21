import requests

query = '''
query {
  Media(search: "LOCA!", type: ANIME) {
    id
    idMal
    title { romaji english }
  }
}
'''
r = requests.post('https://graphql.anilist.co', json={'query': query})
m = r.json().get('data', {}).get('Media', {})
print("LOCA ID:", m.get('id'), "MAL ID:", m.get('idMal'), "Title:", m.get('title'))
