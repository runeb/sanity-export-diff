```
  About
    Tool for exporting and comparing Sanity datasets.
    This tool will create files and folders in current directory.
  Usage
    $ sanity-export-diff <dataset path A> <dataset path B> <path>
  Options
	  --studio-url-a URL to Content Studio for dataset A
	  --studio-url-b URL to Content Studio for dataset B
    --help Show this help
  Examples
    # Compare dataset 'production' with dataset 'staging' in project abcdef1
    # creating a webapp for visualizing the differences in web-files/
    #
    $ sanity-export-diff ../prod.tar.gz ../staging.tar.gz web-files
```
