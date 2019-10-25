import json
import os
import pandas as pd
from os import listdir
from os.path import isfile, join
from pprint import pprint

# main_fields = ['twitter', 'facebook', 'en.wikipedia.org', 'wikidata', 'instagram', 'linkedin', 'pinterest', 'youtube',
#                'google', 'twittersite', 'twittercreator', 'twitterurl', 'facebookpublisher', 'facebookauthor','fetchedNumbers','about','contact',
#                'telephone', 'legalName', 'stype', 'email', 'email1', 'address', 'mailto0', 'mailto1', 'mailto2', 'mailto3', 'mailto4', 'mailto5', 'mailto6', 'mailto7', 'mailto8', 'mailto9']


main_fields = ['twitter_url', 'twitter_url_nonname_match']

extra_fields = []
json_path = 'json'
csv_path = 'csv'
main_csv = 'main25.csv'
extra_csv = 'extra25.csv'
main_fields_list = []
extra_fields_list = []

import sys
reload(sys)
sys.setdefaultencoding('utf8')

def save_to_csv(output_csv, fields_list, columns):
    matrix = []
    for item in fields_list:
        row = []
        row.append(item['url'])
        for column in columns:
            if item['key'] == column:
                row.append(item['value'])
            else:
                row.append('')
        matrix.append(row)
    df = pd.DataFrame(matrix, columns=['url'] + columns)

    # Merge duplicate rows
    for column in columns:

        df[column] = df.groupby(['url'])[column].transform(lambda x: ' '.join(temp for temp in x if temp))

    # Remove duplicate rows
    df = df.drop_duplicates(['url'], keep='first')

    df_obj = df.select_dtypes(['object'])
    df[df_obj.columns] = df_obj.apply(lambda x: x.str.strip())

    df = df.applymap(lambda x: " ".join(sorted(set(x.split()), key=x.split().index)))

    # df = df.applymap(lambda x: x.strip() if type(x) is str else x)
    df.to_csv(output_csv, sep='\t', encoding='utf-8', index=False)


def json_to_csv(file_name):
    print("---------------file_name---------------")
    print(file_name)
    with open(file_name) as fa:
        data = json.load(fa)
    for item in data:
        # get url
        if 'url' not in item or 'result' not in item:
            continue
        url = item['url']
        print('original',item['result'])
        # get result
        try:
            result = json.loads(item['result'].decode('string-escape').strip('"').replace('\r', '').replace('\n', ''))   
        except Exception:            
            try:
                result = json.loads(item['result'].replace('\\\\','').replace('"\\\\','"').replace('\\t','').replace('\\n','').replace('\\"', '').replace('\\','"').strip('"').replace('\r', '').replace('\n', ''))
            except Exception:
                print('json parsing failed.');    
            
        #result = json.loads(item['result'])

        if not result:
            continue
        # get link
        if 'links' in result:
            for link in result['links']:
                for key, value in link.iteritems():
                    if key.lower() in main_fields:
                        if type(value) is not list:
                            main_fields_list.append({'url': url, 'key': key.lower(), 'value': value})
                    else:
                        if type(value) is not list:
                            extra_fields_list.append({'url': url, 'key': key.lower(), 'value': value})
        if 'mailtos' in result:
            i = 0
            for mailto in result['mailtos']:
                if 'mailto'+str(i) in main_fields and type(mailto) is not list:
                    main_fields_list.append({'url': url, 'key': 'mailto'+str(i), 'value': mailto})
                i = i + 1

        if 'twittersite' in result:
            if type(result['twittersite']) is not list:
                main_fields_list.append({'url': url, 'key': 'twittersite', 'value': result['twittersite']})
        if 'twittercreator' in result:
            if type(result['twittercreator']) is not list:
                main_fields_list.append({'url': url, 'key': 'twittercreator', 'value': result['twittercreator']})
        if 'twitterurl' in result:
            if type(result['twitterurl']) is not list:
                main_fields_list.append({'url': url, 'key': 'twitterurl', 'value': result['twitterurl']})
        if 'facebookpublisher' in result:
            if type(result['facebookpublisher']) is not list:
                main_fields_list.append({'url': url, 'key': 'facebookpublisher', 'value': result['facebookpublisher']})
        if 'facebookauthor' in result:
            if type(result['facebookauthor']) is not list:
                main_fields_list.append({'url': url, 'key': 'facebookpublisher', 'value': result['facebookauthor']})
        if 'telephone' in result:
            if type(result['telephone']) is not list:
                main_fields_list.append({'url': url, 'key': 'telephone', 'value': result['telephone']})
        if 'address' in result:
            if type(result['address']) is not list:
                main_fields_list.append({'url': url, 'key': 'address', 'value': result['address']})
        if 'about' in result:
            if type(result['about']) is not list:
                main_fields_list.append({'url': url, 'key': 'about', 'value': result['about']})        
        if 'fetchedNumbers' in result:
            if type(result['fetchedNumbers']) is not list:
                main_fields_list.append({'url': url, 'key': 'fetchedNumbers', 'value': result['fetchedNumbers']})
        if 'contact' in result:
            if type(result['contact']) is not list:
                main_fields_list.append({'url': url, 'key': 'contact', 'value': result['contact']})
        if 'email' in result:
            if type(result['email']) is str:
                main_fields_list.append({'url': url, 'key': 'email', 'value': result['email']})
            if type(result['email']) is list:
                i = 0
                for mail in result['email']:
                    if i > 0:
                        main_fields_list.append({'url': url, 'key': 'email'+str(i), 'value': mail})
                    else:
                        main_fields_list.append({'url': url, 'key': 'email', 'value': mail})
                    i = i + 1
        if 'legalName' in result:
            if type(result['legalName']) is not list:
                main_fields_list.append({'url': url, 'key': 'legalName', 'value': result['legalName']})
        if 'stype' in result:
            if type(result['stype']) is not list:
                main_fields_list.append({'url': url, 'key': 'stype', 'value': result['stype']})

        if 'twitter_url' in result:
            if type(result['twitter_url']) is list:
                if len(result['twitter_url']) > 0:
                    main_fields_list.append({'url': url, 'key': 'twitter_url', 'value': ",".join(result['twitter_url'])})
                else:
                    main_fields_list.append({'url': url, 'key': 'twitter_url', 'value': "--------"})


        if 'twitter_url_nonname_match' in result:
            if type(result['twitter_url_nonname_match']) is list:
                if len(result['twitter_url']) > 0:
                    main_fields_list.append({'url': url, 'key': 'twitter_url_nonname_match', 'value': ",".join(result['twitter_url_nonname_match'])})
                else:
                    main_fields_list.append({'url': url, 'key': 'twitter_url_nonname_match', 'value': "--------"})

def main():
    extra_field = [];
    file_list = [f for f in listdir(json_path) if isfile(join(json_path, f))]
    print('--------------- Scraping/Parsing Json file progress ---------------')
    for file_name in file_list:
        print('--------Start Processing-------- File name : ',file_name)
        json_to_csv(os.path.join(json_path, file_name))
    print('--------------- Scraping/Parsing Json file completed ---------------')

    print('--------------- Saving to main.csv file ---------------')
    save_to_csv(os.path.join(csv_path, main_csv), main_fields_list, main_fields)
    print('--------------- main.csv file already saved ---------------')

    for item in extra_fields_list:
        if item['key'] not in extra_fields:
            extra_fields.append(item['key'])

    for w in extra_fields:
        if w == 'url':
            extra_field.append(w.replace('url', 'URL'))
        else:
            extra_field.append(w)

    print('--------------- Saving to extra.csv file ---------------')
    save_to_csv(os.path.join(csv_path, extra_csv), extra_fields_list, extra_field)
    print('--------------- extra.csv file already saved ---------------')


if __name__ == '__main__':
    main()
